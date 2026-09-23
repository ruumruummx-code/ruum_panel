"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import type { RoleId } from "@/lib/roles";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export type InternalUser = {
  id: string;
  nombre: string;
  email: string;
  role: RoleId;
  avatar?: string;
};

// Usuario principal — Superadmin. Los demás se crean desde Configuración → Supabase Auth + profiles
export const INTERNAL_USERS: InternalUser[] = [
  { id:"u_lomelin", nombre:"Hector Lomelin", email:"lomelinhectorm@gmail.com", role:"superadmin", avatar:"https://i.pravatar.cc/100?img=33" },
];

const STORAGE_KEY = "ruum_role";
const STORAGE_USER_KEY = "ruum_user_id";

type AuthCtx = {
  user: InternalUser;
  role: RoleId;
  users: InternalUser[];
  setRole: (r: RoleId)=>void;
  setUserId: (id:string)=>void;
  isSuperadmin: boolean;
  canManageRoles: boolean;
  supabaseUserEmail: string | null;
  isDemoMode: boolean;
  signOut: ()=>Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserIdState] = useState<string>("u_lomelin");
  const [supabaseEmail, setSupabaseEmail] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(true);
  const [externalUsers, setExternalUsers] = useState<InternalUser[] | null>(null);

  useEffect(()=>{
    const savedUser = localStorage.getItem(STORAGE_USER_KEY);
    const savedRole = localStorage.getItem(STORAGE_KEY) as RoleId | null;
    if (savedUser && INTERNAL_USERS.find(u=>u.id===savedUser)) {
      setUserIdState(savedUser);
    } else if (savedRole) {
      const match = INTERNAL_USERS.find(u=>u.role===savedRole);
      if (match) setUserIdState(match.id);
    }
    const supabase = getSupabaseBrowser();
    if(supabase){
      supabase.auth.getUser().then(({data}: any)=>{
        if(data?.user?.email){
          setSupabaseEmail(data.user.email);
          // Intenta resolver rol desde profiles, fallback a INTERNAL_USERS
          supabase.from("profiles").select("role, nombre").eq("email", data.user.email.toLowerCase()).maybeSingle().then(({data: prof}: any)=>{
            const role = (prof?.role as RoleId) || (INTERNAL_USERS.find(u=>u.email.toLowerCase()===data.user.email.toLowerCase())?.role as RoleId) || "superadmin";
            const nombre = prof?.nombre || INTERNAL_USERS.find(u=>u.email.toLowerCase()===data.user.email.toLowerCase())?.nombre || data.user.email;
            if(role){
              setIsDemo(false);
              // Si es lomelin u otro ya conocido, set id; si es nuevo usuario creado, crea objeto dinámico
              const known = INTERNAL_USERS.find(u=>u.email.toLowerCase()===data.user.email.toLowerCase());
              if(known){
                setUserIdState(known.id);
              } else {
                const dyn: InternalUser = { id: data.user.id, nombre, email: data.user.email, role, avatar: `https://i.pravatar.cc/100?u=${data.user.email}` };
                setExternalUsers([dyn]);
                setUserIdState(dyn.id);
              }
            }
          });
        }
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_e: any, session: any)=>{
        const email = session?.user?.email ?? null;
        setSupabaseEmail(email);
        if(email){
          const match = INTERNAL_USERS.find(u=> u.email.toLowerCase()===email.toLowerCase());
          if(match){
            setIsDemo(false);
            setUserIdState(match.id);
            localStorage.setItem(STORAGE_USER_KEY, match.id);
            localStorage.setItem(STORAGE_KEY, match.role);
          } else {
            // Usuario creado desde Configuración — rol viene de profiles
            supabase.from("profiles").select("role,nombre").eq("email", email.toLowerCase()).maybeSingle().then(({data: prof}: any)=>{
              const role = (prof?.role as RoleId) || "soporte";
              const nombre = prof?.nombre || email;
              const dyn: InternalUser = { id: session.user.id, nombre, email, role, avatar: `https://i.pravatar.cc/100?u=${email}` };
              setExternalUsers([dyn]);
              setUserIdState(dyn.id);
              setIsDemo(false);
              localStorage.setItem(STORAGE_USER_KEY, dyn.id);
              localStorage.setItem(STORAGE_KEY, role);
            });
          }
        } else {
          setIsDemo(true);
        }
      });
      return ()=> sub.subscription.unsubscribe();
    }
  },[]);

  const allUsers = externalUsers ?? INTERNAL_USERS;
  const user = allUsers.find(u=>u.id===userId) ?? INTERNAL_USERS[0];
  const role = user.role;

  const setRole = (r: RoleId)=>{
    const match = INTERNAL_USERS.find(u=>u.role===r);
    if (match) {
      localStorage.setItem(STORAGE_KEY, r);
      localStorage.setItem(STORAGE_USER_KEY, match.id);
      setUserIdState(match.id);
    }
  };
  const setUserId = (id: string)=>{
    const u = allUsers.find(x=>x.id===id);
    if (!u) return;
    localStorage.setItem(STORAGE_USER_KEY, id);
    localStorage.setItem(STORAGE_KEY, u.role);
    setUserIdState(id);
  };

  const signOut = async ()=>{
    const supabase = getSupabaseBrowser();
    if(supabase) await supabase.auth.signOut();
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = "/login";
  };

  const isSuperadmin = role==="superadmin";
  const canManageRoles = isSuperadmin;

  return <Ctx.Provider value={{ user, role, users: allUsers, setRole, setUserId, isSuperadmin, canManageRoles, supabaseUserEmail: supabaseEmail, isDemoMode: isDemo && !supabaseEmail, signOut }}>{children}</Ctx.Provider>;
}

export function useAuth(){
  const ctx = useContext(Ctx);
  if(!ctx) throw new Error("useAuth fuera de AuthProvider");
  return ctx;
}

export function useHasRole(allowed: RoleId[]){
  const { role } = useAuth();
  return allowed.includes(role);
}
