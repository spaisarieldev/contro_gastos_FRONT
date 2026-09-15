import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { GananciasService } from '../../core/ganancias.service';
import { GastosService } from '../../core/gastos.service';
import { DiaGanancia, PlanillaGanancias } from '../../core/models';
import {
  etiquetarMes,
  formatearDinero,
  formatearFechaDisplay,
  mesAnterior,
  mesSiguiente,
  nombreDiaSemana,
  NOMBRES_MES,
} from '../../core/date-utils';

@Component({
  selector: 'app-uber',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './uber.component.html',
  styleUrl: './uber.component.scss',
})
export class UberComponent implements OnInit {
  anio = new Date().getFullYear();
  mes = new Date().getMonth() + 1;
  planilla: PlanillaGanancias | null = null;
  borradores: Record<string, number | null> = {};
  borradoresViajes: Record<string, number | null> = {};
  guardando: Record<string, boolean> = {};
  cargando = false;
  error = '';
  mensaje = '';
  fechaActiva: string | null = null;
  totalGastosSiguiente = 0;
  totalGastosDiarios = 0;

  constructor(
    private readonly gananciasService: GananciasService,
    private readonly gastosService: GastosService,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  get tituloMes(): string {
    return etiquetarMes(this.anio, this.mes);
  }

  get nombreMesActual(): string {
    return NOMBRES_MES[this.mes - 1];
  }

  get nombreMesSiguiente(): string {
    const next = mesSiguiente(this.anio, this.mes);
    return NOMBRES_MES[next.mes - 1];
  }

  get totalFormateado(): string {
    return formatearDinero(this.planilla?.total ?? 0);
  }

  get gastosSiguienteFormateado(): string {
    return formatearDinero(this.totalGastosSiguiente);
  }

  get gastosDiariosFormateado(): string {
    return formatearDinero(this.totalGastosDiarios);
  }

  get disponibleFormateado(): string {
    return formatearDinero(this.disponibleActual);
  }

  /** Total actual del mes (borradores en pantalla). */
  get totalActual(): number {
    if (!this.planilla) {
      return 0;
    }
    let total = 0;
    for (const dia of this.planilla.dias) {
      const valor = this.borradores[dia.fecha];
      if (valor !== null && valor !== undefined && !Number.isNaN(Number(valor))) {
        total += Number(valor);
      }
    }
    return total;
  }

  /** Plata real disponible = ganado − día a día. */
  get disponibleActual(): number {
    return this.totalActual - this.totalGastosDiarios;
  }

  /** Suma de viajes cargados en el mes en vista. */
  get totalViajes(): number {
    if (!this.planilla) {
      return 0;
    }
    let total = 0;
    for (const dia of this.planilla.dias) {
      const valor = this.borradoresViajes[dia.fecha];
      if (valor !== null && valor !== undefined && !Number.isNaN(Number(valor))) {
        total += Number(valor);
      }
    }
    return total;
  }

  /** Porcentaje del objetivo mensual cumplido (sobre disponible real). */
  get porcentajeObjetivo(): number {
    if (this.totalGastosSiguiente <= 0) {
      return 0;
    }
    return (this.disponibleActual / this.totalGastosSiguiente) * 100;
  }

  get anchoBarraObjetivo(): number {
    return Math.min(Math.max(this.porcentajeObjetivo, 0), 100);
  }

  get porcentajeObjetivoFormateado(): string {
    const pct = this.porcentajeObjetivo;
    if (!Number.isFinite(pct)) {
      return '0%';
    }
    return `${Math.round(pct)}%`;
  }

  /** Monto que falta para cubrir el gasto del mes siguiente. */
  get faltaAlObjetivo(): number {
    return Math.max(0, this.totalGastosSiguiente - this.disponibleActual);
  }

  /**
   * Días restantes del mes en vista (incluye hoy si es el mes actual).
   * Meses pasados → 0; meses futuros → todos los días del mes.
   */
  get diasRestantes(): number {
    const ultimoDia = new Date(this.anio, this.mes, 0).getDate();
    const hoy = new Date();
    const anioHoy = hoy.getFullYear();
    const mesHoy = hoy.getMonth() + 1;
    const diaHoy = hoy.getDate();

    if (this.anio > anioHoy || (this.anio === anioHoy && this.mes > mesHoy)) {
      return ultimoDia;
    }
    if (this.anio < anioHoy || (this.anio === anioHoy && this.mes < mesHoy)) {
      return 0;
    }
    return Math.max(0, ultimoDia - diaHoy + 1);
  }

  get promedioDiarioNecesario(): number | null {
    if (this.diasRestantes <= 0) {
      return null;
    }
    if (this.faltaAlObjetivo <= 0) {
      return 0;
    }
    return Math.ceil(this.faltaAlObjetivo / this.diasRestantes);
  }

  get promedioDiarioFormateado(): string {
    const promedio = this.promedioDiarioNecesario;
    if (promedio === null) {
      return '—';
    }
    return formatearDinero(promedio);
  }

  formatearFecha = formatearFechaDisplay;
  formatear = formatearDinero;
  diaSemana = nombreDiaSemana;

  cargar(): void {
    this.cargando = true;
    this.error = '';
    const next = mesSiguiente(this.anio, this.mes);

    forkJoin({
      ganancias: this.gananciasService.listarMes(this.anio, this.mes),
      gastosSiguiente: this.gastosService.listarMes(next.anio, next.mes),
      gastosActuales: this.gastosService.listarMes(this.anio, this.mes),
    }).subscribe({
      next: ({ ganancias, gastosSiguiente, gastosActuales }) => {
        this.planilla = ganancias;
        this.totalGastosSiguiente = gastosSiguiente.total;
        this.totalGastosDiarios = gastosActuales.totalDiarios ?? 0;
        this.borradores = {};
        this.borradoresViajes = {};
        for (const dia of ganancias.dias) {
          this.borradores[dia.fecha] = dia.monto;
          this.borradoresViajes[dia.fecha] = dia.viajes ?? null;
        }
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar la planilla. ¿Está corriendo el backend?';
        this.cargando = false;
      },
    });
  }

  anterior(): void {
    const prev = mesAnterior(this.anio, this.mes);
    this.anio = prev.anio;
    this.mes = prev.mes;
    this.cargar();
  }

  siguiente(): void {
    const next = mesSiguiente(this.anio, this.mes);
    this.anio = next.anio;
    this.mes = next.mes;
    this.cargar();
  }

  esHoy(fecha: string): boolean {
    return fecha === this.fechaHoyIso();
  }

  /** Días posteriores a hoy (solo para estilo visual). */
  esFechaFutura(fecha: string): boolean {
    return fecha > this.fechaHoyIso();
  }

  private fechaHoyIso(): string {
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = String(hoy.getMonth() + 1).padStart(2, '0');
    const d = String(hoy.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  onFocusMonto(fecha: string): void {
    this.fechaActiva = fecha;
  }

  onBlur(dia: DiaGanancia): void {
    this.fechaActiva = null;

    const valorMonto = this.borradores[dia.fecha];
    const valorViajes = this.borradoresViajes[dia.fecha];
    const montoVacio =
      valorMonto === null || valorMonto === undefined || Number.isNaN(Number(valorMonto));
    const viajesVacios =
      valorViajes === null || valorViajes === undefined || Number.isNaN(Number(valorViajes));

    if (montoVacio) {
      if (dia.monto !== null || dia.viajes !== null) {
        this.borrar(dia);
      } else {
        this.borradoresViajes[dia.fecha] = null;
      }
      return;
    }

    const monto = Math.min(Math.floor(Number(valorMonto)), 9_999_999);
    const viajes = viajesVacios ? null : Math.min(Math.floor(Number(valorViajes)), 9_999);
    this.borradores[dia.fecha] = monto;
    this.borradoresViajes[dia.fecha] = viajes;

    if (monto === dia.monto && viajes === (dia.viajes ?? null)) {
      return;
    }

    this.guardar(dia.fecha, monto, viajes);
  }

  guardar(fecha: string, monto: number, viajes: number | null): void {
    this.guardando[fecha] = true;
    this.mensaje = '';
    this.gananciasService.upsert(fecha, monto, viajes).subscribe({
      next: () => {
        this.guardando[fecha] = false;
        this.mensaje = `Guardado ${formatearFechaDisplay(fecha)}`;
        this.cargar();
      },
      error: () => {
        this.guardando[fecha] = false;
        this.error = `Error al guardar ${fecha}`;
      },
    });
  }

  borrar(dia: DiaGanancia): void {
    this.guardando[dia.fecha] = true;
    this.gananciasService.eliminar(dia.fecha).subscribe({
      next: () => {
        this.guardando[dia.fecha] = false;
        this.borradores[dia.fecha] = null;
        this.borradoresViajes[dia.fecha] = null;
        this.cargar();
      },
      error: () => {
        this.guardando[dia.fecha] = false;
        this.error = `Error al borrar ${dia.fecha}`;
      },
    });
  }
}
