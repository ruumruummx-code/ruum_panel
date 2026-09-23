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

const STORAGE_KEY = "ruum_role";
const STORAGE_USER_KEY = "ruum_user_id";

export const INTERNAL_USERS: InternalUser[] = [
  { id:"u_super", nombre:"Sofía Ramírez", email:"sofia@moviliax.mx", role:"superadmin", avatar:"https://i.pravatar.cc/100?img=12" },
  { id:"u_oper", nombre:"Diego Martínez", email:"diego@moviliax.mx", role:"admin_operativo", avatar:"https://i.pravatar.cc/100?img=15" },
  { id:"u_fin", nombre:"Valeria Torres", email:"valeria@ruum.mx", role:"finanzas", avatar:"https://i.pravatar.cc/100?img=5" },
  { id:"u_sop", nombre:"Laura Gómez", email:"laura@ruum.mx", role:"soporte", avatar:"https://i.pravatar.cc/100?img=9" },
  { id:"u_val", nombre:"Jorge Herrera", email:"jorge@ruum.mx", role:"validador", avatar:"https://i.pravatar.cc/100?img=8" },
  { id:"u_com", nombre:"Ana López", email:"ana@ruum.mx", role:"comercial", avatar:"https://i.pravatar.cc/100?img=32" },
];

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
  const [userId, setUserIdState] = useState<string>("u_super");
  const [supabaseEmail, setSupabaseEmail] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(true);

  useEffect(()=>{
    const savedUser = localStorage.getItem(STORAGE_USER_KEY);
    const savedRole = localStorage.getItem(STORAGE_KEY) as RoleId | null;
    if (savedUser && INTERNAL_USERS.find(u=>u.id===savedUser)) {
      setUserIdState(savedUser);
    } else if (savedRole) {
      const match = INTERNAL_USERS.find(u=>u.role===savedRole);
      if (match) setUserIdState(match.id);
    }
    // Intentar sincronizar con Supabase Auth si hay sesión
    const supabase = getSupabaseBrowser();
    if(supabase){
      supabase.auth.getUser().then(({data}: any)=>{
        if(data?.user?.email){
          setSupabaseEmail(data.user.email);
          const match = INTERNAL_USERS.find(u=> u.email.toLowerCase()===data.user!.email!.toLowerCase());
          if(match){
            setIsDemo(false);
            setUserIdState(match.id);
          }
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
          }
        } else {
          setIsDemo(true);
        }
      });
      return ()=> sub.subscription.unsubscribe();
    }
  },[]);

  const user = INTERNAL_USERS.find(u=>u.id===userId) ?? INTERNAL_USERS[0];
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
    const u = INTERNAL_USERS.find(x=>x.id===id);
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

  return <Ctx.Provider value={{ user, role, users: INTERNAL_USERS, setRole, setUserId, isSuperadmin, canManageRoles, supabaseUserEmail: supabaseEmail, isDemoMode: isDemo && !supabaseEmail, signOut }}>{children}</Ctx.Provider>;
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
