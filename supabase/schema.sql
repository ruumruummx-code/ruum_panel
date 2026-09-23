-- Ruum Panel — Schema Supabase
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

insert into public.tad_config (id) values (1)
on conflict (id) do nothing;

-- 2) Traslado — centro operativo (para conectar tabla Traslado del panel)
create table if not exists public.Traslado (
  id text primary key, -- RR-XXXXX
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
  Traslado_realizados int default 0,
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
  Traslado int default 0,
  created_at timestamptz default now()
);

-- 5) Incidencias
create table if not exists public.incidencias (
  id text primary key,
  Traslado_id text references public.Traslado(id),
  tipo text not null,
  descripcion text not null,
  estatus text not null,
  responsable text,
  created_at timestamptz default now()
);

-- RLS — por ahora abierto para panel admin (ajustar a auth real después)
alter table public.tad_config enable row level security;
alter table public.Traslado enable row level security;
alter table public.conductores enable row level security;
alter table public.empresas enable row level security;
alter table public.incidencias enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where policyname='tad_config_all') then
    create policy tad_config_all on public.tad_config for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname='Traslado_all') then
    create policy Traslado_all on public.Traslado for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname='conductores_all') then
    create policy conductores_all on public.conductores for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname='empresas_all') then
    create policy empresas_all on public.empresas for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname='incidencias_all') then
    create policy incidencias_all on public.incidencias for all using (true) with check (true);
  end if;
end $$;

-- 6) RBAC — Perfiles internos (roles)
-- Usa auth.users.id cuando exista; por ahora profiles con id uuid libre para panel
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  nombre text not null,
  role text not null check (role in ('superadmin','admin_operativo','finanzas','soporte','validador','comercial')),
  avatar text,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid
);

-- Seed 6 usuarios internos (id fijos para demo)
insert into public.profiles (id, email, nombre, role) values
  ('00000000-0000-0000-0000-000000000001', 'sofia@moviliax.mx', 'Sofía Ramírez', 'superadmin'),
  ('00000000-0000-0000-0000-000000000002', 'diego@moviliax.mx', 'Diego Martínez', 'admin_operativo'),
  ('00000000-0000-0000-0000-000000000003', 'valeria@ruum.mx', 'Valeria Torres', 'finanzas'),
  ('00000000-0000-0000-0000-000000000004', 'laura@ruum.mx', 'Laura Gómez', 'soporte'),
  ('00000000-0000-0000-0000-000000000005', 'jorge@ruum.mx', 'Jorge Herrera', 'validador'),
  ('00000000-0000-0000-0000-000000000006', 'ana@ruum.mx', 'Ana López', 'comercial')
on conflict (id) do nothing;

-- 7) Bitácora de cambios de roles (auditoría — solo superadmin escribe)
create table if not exists public.role_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  target_id uuid references public.profiles(id),
  from_role text,
  to_role text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.role_audit enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where policyname='profiles_all') then
    create policy profiles_all on public.profiles for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname='role_audit_all') then
    create policy role_audit_all on public.role_audit for all using (true) with check (true);
  end if;
end $$;

-- Índices útiles
create index if not exists idx_Traslado_estatus on public.Traslado(estatus);
create index if not exists idx_Traslado_fecha on public.Traslado(fecha);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_email on public.profiles(email);
