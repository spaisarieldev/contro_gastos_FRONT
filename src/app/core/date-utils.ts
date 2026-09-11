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
