export interface DiaGanancia {
  dia: number;
  fecha: string;
  id: number | null;
  monto: number | null;
  viajes: number | null;
}

export interface PlanillaGanancias {
  anio: number;
  mes: number;
  diasEnMes: number;
  total: number;
  dias: DiaGanancia[];
}

export type TipoGasto = 'MENSUAL' | 'UNICO' | 'DIARIO';

export interface Gasto {
  id: number;
  descripcion: string;
  monto: number;
  tipo: TipoGasto;
  fecha: string;
  pagado: boolean;
  activo: boolean;
  plantillaKey: string | null;
}

export interface PlanillaGastos {
  anio: number;
  mes: number;
  total: number;
  totalPagado: number;
  totalPendiente: number;
  totalDiarios: number;
  gastos: Gasto[];
}

export interface CreateGastoPayload {
  descripcion: string;
  monto: number;
  tipo: TipoGasto;
  fecha: string;
  pagado?: boolean;
}

export interface UpdateGastoPayload {
  descripcion?: string;
  monto?: number;
  tipo?: TipoGasto;
  fecha?: string;
  pagado?: boolean;
  activo?: boolean;
}

export interface ResumenMes {
  anio: number;
  mes: number;
  anioGastos: number;
  mesGastos: number;
  totalGanancias: number;
  totalGastosDiarios: number;
  disponible: number;
  totalGastos: number;
  balanceNeto: number;
  faltaCubrir: number;
  sobrante: number;
  evolucionDiaria: { dia: number; fecha: string; monto: number }[];
}

export interface EvolucionMensual {
  meses: {
    anio: number;
    mes: number;
    anioGastos: number;
    mesGastos: number;
    etiqueta: string;
    etiquetaGastos: string;
    totalGanancias: number;
    totalGastosDiarios: number;
    disponible: number;
    totalGastos: number;
    balanceNeto: number;
    faltaCubrir: number;
    sobrante: number;
  }[];
}
