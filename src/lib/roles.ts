export type RoleId =
  | "superadmin"
  | "admin_operativo"
  | "finanzas"
  | "soporte"
  | "validador"
  | "comercial";

export type Permission =
  | "dashboard:view"
  | "viajes:view" | "viajes:manage"
  | "usuarios:view" | "usuarios:manage"
  | "conductores:view" | "conductores:manage"
  | "evidencia:view" | "evidencia:manage"
  | "incidencias:view" | "incidencias:manage"
  | "pagos:view" | "pagos:manage"
  | "documentos:view" | "documentos:manage"
  | "tarifas:view" | "tarifas:manage"
  | "empresas:view" | "empresas:manage"
  | "reportes:view"
  | "config:view" | "config:manage_users" | "config:manage_roles" | "config:manage_zonas";

export type RoleDef = {
  id: RoleId;
  label: string;
  description: string;
  color: string;
  permissions: Permission[] | ["*"]; // * = todo
};

export const ROLES: Record<RoleId, RoleDef> = {
  superadmin: {
    id: "superadmin",
    label: "Superadministrador",
    description: "Acceso total. Único con privilegio para asignar / revocar permisos y gestionar usuarios internos.",
    color: "bg-slate-900 text-white border-slate-900",
    permissions: ["*"],
  },
  admin_operativo: {
    id: "admin_operativo",
    label: "Administrador Operativo",
    description: "Gestión de traslados, conductores, evidencias e incidencias. Atención a usuarios, revisión/aprobación de documentos y gestión de empresas y usuarios corporativos.",
    color: "bg-[#ff4d11] text-white border-[#ff4d11]",
    permissions: [
      "dashboard:view",
      "viajes:view","viajes:manage",
      "conductores:view","conductores:manage",
      "evidencia:view","evidencia:manage",
      "incidencias:view","incidencias:manage",
      "usuarios:view","usuarios:manage",
      "documentos:view","documentos:manage",
      "empresas:view","empresas:manage",
      "tarifas:view",
      "pagos:view",
      "reportes:view",
      "config:view",
    ],
  },
  finanzas: {
    id: "finanzas",
    label: "Asesor de Finanzas",
    description: "Acceso a pagos, depósitos, gastos y reportes. Solo lectura/operación financiera.",
    color: "bg-emerald-600 text-white border-emerald-600",
    permissions: [
      "dashboard:view",
      "pagos:view","pagos:manage",
      "reportes:view",
      "viajes:view", // para conciliar
      "empresas:view",
    ],
  },
  soporte: {
    id: "soporte",
    label: "Agente de Soporte",
    description: "Atención a usuarios, conductores e incidencias. Sin acceso financiero ni configuración.",
    color: "bg-sky-600 text-white border-sky-600",
    permissions: [
      "dashboard:view",
      "usuarios:view","usuarios:manage",
      "conductores:view",
      "incidencias:view","incidencias:manage",
      "viajes:view",
      "evidencia:view",
      "documentos:view",
    ],
  },
  validador: {
    id: "validador",
    label: "Validador Documental",
    description: "Revisión y aprobación de documentos de conductores y empresas.",
    color: "bg-violet-600 text-white border-violet-600",
    permissions: [
      "dashboard:view",
      "documentos:view","documentos:manage",
      "conductores:view",
      "empresas:view",
      "usuarios:view",
    ],
  },
  comercial: {
    id: "comercial",
    label: "Agente Comercial",
    description: "Gestión de empresas, usuarios corporativos y condiciones comerciales (tarifas).",
    color: "bg-amber-500 text-white border-amber-500",
    permissions: [
      "dashboard:view",
      "empresas:view","empresas:manage",
      "usuarios:view","usuarios:manage",
      "tarifas:view",
      "viajes:view",
      "reportes:view",
    ],
  },
};

export const ALL_PERMISSIONS: Permission[] = [
  "dashboard:view",
  "viajes:view","viajes:manage",
  "usuarios:view","usuarios:manage",
  "conductores:view","conductores:manage",
  "evidencia:view","evidencia:manage",
  "incidencias:view","incidencias:manage",
  "pagos:view","pagos:manage",
  "documentos:view","documentos:manage",
  "tarifas:view","tarifas:manage",
  "empresas:view","empresas:manage",
  "reportes:view",
  "config:view","config:manage_users","config:manage_roles","config:manage_zonas",
];

// Helpers
export function hasPermission(role: RoleId, perm: Permission): boolean {
  const def = ROLES[role];
  if (!def) return false;
  if ((def.permissions as string[]).includes("*")) return true;
  return (def.permissions as Permission[]).includes(perm);
}

export function canAccessRoute(role: RoleId, href: string): boolean {
  const map: Record<string, Permission> = {
    "/": "dashboard:view",
    "/viajes": "viajes:view",
    "/usuarios": "usuarios:view",
    "/conductores": "conductores:view",
    "/evidencia": "evidencia:view",
    "/incidencias": "incidencias:view",
    "/pagos": "pagos:view",
    "/documentos": "documentos:view",
    "/tarifas": "tarifas:view",
    "/empresas": "empresas:view",
    "/reportes": "reportes:view",
    "/configuracion": "config:view",
  };
  // subrutas: /viajes/123 -> /viajes
  const base = "/" + href.replace(/^\//,"").split("/")[0];
  const key = href === "/" ? "/" : base;
  const perm = map[key];
  if (!perm) return true;
  return hasPermission(role, perm);
}

export function roleLabel(id: RoleId) { return ROLES[id]?.label ?? id; }
