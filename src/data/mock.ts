export type trasladostatus = "Pendiente de asignación"|"Conductor asignado"|"En curso"|"Finalizado"|"Cancelado"|"En revisión por incidencia"|"Solicitud recibida"|"Evidencia pendiente";
export type traslados = {
  id: string; cliente: string; empresa?: string; vehiculo: string; origen: string; destino: string;
  fecha: string; hora: string; conductor?: string; estatus: trasladostatus; tarifa: number; pagoConductor: number; evidencia: string; incidencia?: string;
};

export const traslados: traslados[] = [
  { id:"RR-24081", cliente:"Carlos Mendoza", empresa:"AutoGrupo León", vehiculo:"Mazda 3 2023 • Rojo • GHT-341-A", origen:"León, Gto. — Agencia Mazda Torres Landa", destino:"Querétaro, Qro. — Av. 5 de Febrero 102", fecha:"21 Sep 2026", hora:"09:30", conductor:"Luis Ramírez", estatus:"En curso", tarifa:3850, pagoConductor:2200, evidencia:"Completa" },
  { id:"RR-24082", cliente:"Ana Torres", vehiculo:"VW Jetta 2022 • Blanco • JKL-882-B", origen:"Irapuato, Gto. — Lote Central", destino:"León, Gto. — Blvd. Adolfo López Mateos", fecha:"21 Sep 2026", hora:"11:00", estatus:"Pendiente de asignación", tarifa:2100, pagoConductor:1350, evidencia:"Pendiente" },
  { id:"RR-24083", cliente:"Flotilla Bimbo", empresa:"Grupo Bimbo", vehiculo:"Nissan NP300 2024 • Blanco • PQR-112-C", origen:"Silao, Gto. — Planta Bimbo", destino:"Aguascalientes, Ags. — Parque Industrial", fecha:"21 Sep 2026", hora:"13:00", conductor:"Jorge Herrera", estatus:"Conductor asignado", tarifa:5200, pagoConductor:3100, evidencia:"Pendiente" },
  { id:"RR-24084", cliente:"Daniela Ruiz", vehiculo:"Kia Seltos 2023 • Gris • MNB-903", origen:"León, Gto. — Col. Panorama", destino:"CDMX — Santa Fe", fecha:"21 Sep 2026", hora:"07:00", conductor:"Fernando Cruz", estatus:"Finalizado", tarifa:7400, pagoConductor:4200, evidencia:"Aprobada" },
  { id:"RR-24085", cliente:"Taller MasterFix", empresa:"MasterFix", vehiculo:"Toyota Hilux 2021 • Plata", origen:"León — Taller MasterFix", destino:"San Luis Potosí — Agencia Toyota", fecha:"20 Sep 2026", hora:"16:00", estatus:"En revisión por incidencia", tarifa:4600, pagoConductor:2800, evidencia:"Incompleta", incidencia:"Daño reportado" },
  { id:"RR-24086", cliente:"Roberto Salas", vehiculo:"Honda Civic 2020 • Negro", origen:"Querétaro — Juriquilla", destino:"León — Centro", fecha:"21 Sep 2026", hora:"15:30", conductor:"Miguel Ángel Soto", estatus:"Solicitud recibida", tarifa:2900, pagoConductor:1700, evidencia:"Pendiente" },
  { id:"RR-24087", cliente:"Aseguradora GNP", empresa:"GNP Seguros", vehiculo:"Chevrolet Aveo 2023 • Azul", origen:"Guanajuato — GNP Taller", destino:"León — Cliente final", fecha:"21 Sep 2026", hora:"10:00", estatus:"Evidencia pendiente", tarifa:1950, pagoConductor:1100, evidencia:"Incompleta" },
  { id:"RR-24088", cliente:"Lote Autos Premier", empresa:"Autos Premier", vehiculo:"BMW X1 2024 • Blanco", origen:"León — Lote Premier", destino:"Guadalajara — Av. Vallarta", fecha:"22 Sep 2026", hora:"06:00", conductor:"Oscar Medina", estatus:"Conductor asignado", tarifa:6800, pagoConductor:3900, evidencia:"Pendiente" },
];

export const conductores = [
  { id:"C-101", nombre:"Luis Ramírez", foto:"LR", tel:"477 123 4567", estatus:"En traslados", disp:"En traslados", cert:"Activo", traslados:142, cal:4.9, ganancias:48200 },
  { id:"C-102", nombre:"Jorge Herrera", foto:"JH", tel:"477 987 2234", estatus:"Disponible", disp:"Disponible", cert:"Activo", traslados:98, cal:4.8, ganancias:36100 },
  { id:"C-103", nombre:"Fernando Cruz", foto:"FC", tel:"442 555 0199", estatus:"Disponible", disp:"Disponible", cert:"Activo", traslados:201, cal:4.95, ganancias:71200 },
  { id:"C-104", nombre:"Miguel Ángel Soto", foto:"MS", tel:"477 333 8877", estatus:"Pendiente de validación", disp:"No disponible", cert:"Pendiente", traslados:0, cal:0, ganancias:0 },
  { id:"C-105", nombre:"Oscar Medina", foto:"OM", tel:"477 444 5566", estatus:"Activo", disp:"Disponible", cert:"Activo", traslados:67, cal:4.7, ganancias:24500 },
  { id:"C-106", nombre:"Gabriela Ortiz", foto:"GO", tel:"477 222 3344", estatus:"Documentación vencida", disp:"No disponible", cert:"Vencido", traslados:88, cal:4.6, ganancias:29800 },
];

export const usuarios = [
  { id:"U-201", nombre:"Carlos Mendoza", correo:"carlos.mendoza@email.com", tel:"477 111 2233", tipo:"Empresarial", empresa:"AutoGrupo León", registro:"12 Ene 2026", estatus:"Activo", traslados:23 },
  { id:"U-202", nombre:"Ana Torres", correo:"ana.torres@email.com", tel:"462 555 7788", tipo:"Personal", registro:"03 Mar 2026", estatus:"Activo", traslados:4 },
  { id:"U-203", nombre:"Grupo Bimbo — Flotilla", correo:"flotilla@bimbo.com.mx", tel:"477 999 0011", tipo:"Flotilla", empresa:"Grupo Bimbo", registro:"15 Feb 2026", estatus:"Activo", traslados:41 },
  { id:"U-204", nombre:"Daniela Ruiz", correo:"daniela.ruiz@email.com", tel:"477 123 9988", tipo:"Personal", registro:"28 Ago 2026", estatus:"Activo", traslados:1 },
  { id:"U-205", nombre:"MasterFix Taller", correo:"ops@masterfix.mx", tel:"477 777 6655", tipo:"Taller", registro:"10 Jun 2026", estatus:"Suspendido", traslados:12 },
];

export const empresas = [
  { id:"E-01", razon:"AutoGrupo León S.A. de C.V.", comercial:"AutoGrupo León", rfc:"AGL180320HT1", contacto:"Carlos Mendoza", traslados:23, tipo:"Agencia automotriz"},
  { id:"E-02", razon:"Grupo Bimbo S.A.B. de C.V.", comercial:"Grupo Bimbo", rfc:"GBI540901H18", contacto:"Fernanda López", traslados:41, tipo:"Flotilla"},
  { id:"E-03", razon:"Autos Premier del Bajío", comercial:"Autos Premier", rfc:"APB210415KQ2", contacto:"Ricardo Salas", traslados:18, tipo:"Lote de autos"},
  { id:"E-04", razon:"GNP Seguros", comercial:"GNP Seguros", rfc:"GNP921012QW3", contacto:"Mariana Vega", traslados:9, tipo:"Aseguradora"},
  { id:"E-05", razon:"MasterFix S.A.", comercial:"MasterFix", rfc:"MFX190201AB9", contacto:"Hugo Torres", traslados:12, tipo:"Taller"},
];

export const incidencias = [
  { id:"INC-881", traslados:"RR-24085", tipo:"Daño reportado", desc:"Rayón en facia delantera no documentado en evidencia inicial", fecha:"20 Sep 2026 16:42", estatus:"En revisión", responsable:"Sofía R." },
  { id:"INC-882", traslados:"RR-24081", tipo:"Retraso", desc:"Conductor reporta tráfico en carretera León-Qro. +25 min", fecha:"21 Sep 2026 09:55", estatus:"En seguimiento", responsable:"Operaciones" },
  { id:"INC-883", traslados:"RR-24087", tipo:"Falta de evidencia", desc:"Fotos de tablero y kilometraje ilegibles", fecha:"21 Sep 2026 08:20", estatus:"Nueva", responsable:"Sin asignar" },
  { id:"INC-884", traslados:"RR-24083", tipo:"Contacto no disponible", desc:"Contacto en destino no contesta", fecha:"21 Sep 2026 10:10", estatus:"Resuelta", responsable:"Diego M." },
];

export const pagos = [
  { id:"P-301", traslados:"RR-24084", cliente:"Daniela Ruiz", tarifa:7400, metodo:"Transferencia", estatus:"Pagado", fecha:"20 Sep 2026" },
  { id:"P-302", traslados:"RR-24081", cliente:"Carlos Mendoza", tarifa:3850, metodo:"Crédito corporativo", estatus:"Pendiente", fecha:"21 Sep 2026" },
  { id:"P-303", traslados:"RR-24085", cliente:"MasterFix", tarifa:4600, metodo:"Transferencia", estatus:"En revisión", fecha:"20 Sep 2026" },
  { id:"P-304", traslados:"RR-24083", cliente:"Grupo Bimbo", tarifa:5200, metodo:"Factura mensual", estatus:"Pendiente", fecha:"21 Sep 2026" },
];

export const documentos = [
  { id:"DOC-01", titular:"Luis Ramírez", tipo:"Licencia de conducir", vence:"12 Dic 2027", estatus:"Aprobado"},
  { id:"DOC-02", titular:"Miguel Ángel Soto", tipo:"Identificación oficial", vence:"—", estatus:"En revisión"},
  { id:"DOC-03", titular:"Gabriela Ortiz", tipo:"Licencia de conducir", vence:"03 Sep 2026", estatus:"Vencido"},
  { id:"DOC-04", titular:"Jorge Herrera", tipo:"Comprobante de domicilio", vence:"15 Mar 2027", estatus:"Aprobado"},
  { id:"DOC-05", titular:"Grupo Bimbo", tipo:"Constancia fiscal", vence:"—", estatus:"Aprobado"},
  { id:"DOC-06", titular:"Oscar Medina", tipo:"Constancia situación fiscal", vence:"—", estatus:"Requiere actualización"},
];

export const kpis = {
  activos: 8, pendientes: 3, programadosHoy: 12, finalizadosHoy: 5,
  conductoresDisponibles: 14, conductoresEntraslados: 8, incidenciasAbiertas: 4,
  docsPendientes: 6, pagosPendientes: 7, ingresosHoy: 42850,
};
