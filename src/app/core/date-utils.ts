export const NOMBRES_MES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export function etiquetarMes(anio: number, mes: number): string {
  return `${NOMBRES_MES[mes - 1]} ${anio}`;
}

export function mesAnterior(anio: number, mes: number): { anio: number; mes: number } {
  if (mes === 1) {
    return { anio: anio - 1, mes: 12 };
  }
  return { anio, mes: mes - 1 };
}

export function mesSiguiente(anio: number, mes: number): { anio: number; mes: number } {
  if (mes === 12) {
    return { anio: anio + 1, mes: 1 };
  }
  return { anio, mes: mes + 1 };
}

export function formatearDinero(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) {
    return '—';
  }
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(valor);
}

/** Convierte YYYY-MM-DD → DD-MM-AAAA */
export function formatearFechaDisplay(fechaIso: string): string {
  const [anio, mes, dia] = fechaIso.split('-');
  if (!anio || !mes || !dia) {
    return fechaIso;
  }
  return `${dia}-${mes}-${anio}`;
}

const DIAS_SEMANA = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

/** Convierte YYYY-MM-DD → nombre del día de la semana */
export function nombreDiaSemana(fechaIso: string): string {
  const [anio, mes, dia] = fechaIso.split('-').map(Number);
  if (!anio || !mes || !dia) {
    return '';
  }
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return DIAS_SEMANA[fecha.getUTCDay()];
}
