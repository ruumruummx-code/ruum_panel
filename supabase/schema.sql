-- Ruum Panel — Schema Supabase (corregido)
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query > Paste > Run
-- Proyecto: puomblsfbxuthcunmirg

-- 1) TAD Config — Variables Monetarias Base (singleton id=1)
create table if not exists public.tad_config (
  id int primary key check (id = 1),
  tarifa_base numeric not null default 400,
  costo_km_urbano numeric not null default 16.50,
  costo_km_interurbano numeric not null default 14.50,
  costo_km_interestatal numeric not null default 12.50,
  costo_hora numeric not null default 300,
  tarifa_minima numeric not null default 650,
  updated_at timestamptz not null default now(),
  updated_by text
);
insert into public.tad_config (id) values (1) on conflict (id) do nothing;

-- 2) traslados — centro operativo
create table if not exists public.traslados (
  id text primary key,
  cliente text not null,
  empresa text,
  vehiculo text not null,
  origen text not null,
  destino text not null,
  fecha date not null,
  hora time not null,
  conductor_id text references public.conductores(id),
  estatus text not null,
  tarifa numeric not null,
  pago_conductor numeric not null,
  evidencia text,
  created_at timestamptz default now()
);

-- 3) Conductores
create table if not exists public.conductores (
  id text primary key,
  nombre text not null,
  telefono text,
  correo text,
  estatus text not null,
  disponibilidad text not null,
  certificacion text not null,
  traslados_realizados int default 0,
  calificacion numeric default 0,
  ganancias numeric default 0,
  created_at timestamptz default now()
);

-- 4) Empresas
create table if not exists public.empresas (
  id text primary key,
  razon_social text not null,
  nombre_comercial text not null,
  rfc text,
  contacto_principal text,
  tipo text not null,
  traslados int default 0,
  created_at timestamptz default now()
);

-- 5) Incidencias
create table if not exists public.incidencias (
  id text primary key,
  traslados_id text references public.traslados(id),
  tipo text not null,
  descripcion text not null,
  estatus text not null,
  responsable text,
  created_at timestamptz default now()
);

-- 6) RBAC — Perfiles internos (roles) — FIX: columna "user_role" (role es palabra reservada)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  nombre text not null,
  user_role text not null check (user_role in ('superadmin','admin_operativo','finanzas','soporte','validador','comercial')),
  avatar text,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid
);

-- Migración si vienes del schema anterior con columna "role"
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='role') then
    alter table public.profiles rename column role to user_role;
  end if;
end $$;

-- Seed superadmin principal (id real de auth.users para lomelinhectorm@gmail.com se insertará vía API; este seed es fallback)
insert into public.profiles (email, nombre, user_role) values
  ('lomelinhectorm@gmail.com', 'Hector Lomelin', 'superadmin')
on conflict (email) do update set user_role = excluded.user_role, nombre = excluded.nombre;

-- 7) Bitácora de cambios de roles
create table if not exists public.role_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  target_id uuid references public.profiles(id),
  from_role text,
  to_role text,
  created_at timestamptz default now()
);

-- RLS
alter table public.tad_config enable row level security;
alter table public.traslados enable row level security;
alter table public.conductores enable row level security;
alter table public.empresas enable row level security;
alter table public.incidencias enable row level security;
alter table public.profiles enable row level security;
alter table public.role_audit enable row level security;

-- Políticas (drop + create para evitar IF NOT EXISTS no soportado en CREATE POLICY)
drop policy if exists tad_config_all on public.tad_config;
create policy tad_config_all on public.tad_config for all using (true) with check (true);

drop policy if exists traslados_all on public.traslados;
create policy traslados_all on public.traslados for all using (true) with check (true);

drop policy if exists conductores_all on public.conductores;
create policy conductores_all on public.conductores for all using (true) with check (true);

drop policy if exists empresas_all on public.empresas;
create policy empresas_all on public.empresas for all using (true) with check (true);

drop policy if exists incidencias_all on public.incidencias;
create policy incidencias_all on public.incidencias for all using (true) with check (true);

drop policy if exists profiles_all on public.profiles;
create policy profiles_all on public.profiles for all using (true) with check (true);

drop policy if exists role_audit_all on public.role_audit;
create policy role_audit_all on public.role_audit for all using (true) with check (true);

-- Índices
create index if not exists idx_traslados_estatus on public.traslados(estatus);
create index if not exists idx_traslados_fecha on public.traslados(fecha);
create index if not exists idx_profiles_role on public.profiles(user_role);
create index if not exists idx_profiles_email on public.profiles(email);
