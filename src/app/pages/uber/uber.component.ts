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
  guardando: Record<string, boolean> = {};
  cargando = false;
  error = '';
  mensaje = '';
  fechaActiva: string | null = null;
  totalGastosSiguiente = 0;

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

  get nombreMesSiguiente(): string {
    const next = mesSiguiente(this.anio, this.mes);
    return NOMBRES_MES[next.mes - 1].toUpperCase();
  }

  get tituloColumnaActualGasto(): string {
    return `ACTUAL - GASTO ${this.nombreMesSiguiente}`;
  }

  get totalFormateado(): string {
    return formatearDinero(this.planilla?.total ?? 0);
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
      gastos: this.gastosService.listarMes(next.anio, next.mes),
    }).subscribe({
      next: ({ ganancias, gastos }) => {
        this.planilla = ganancias;
        this.totalGastosSiguiente = gastos.total;
        this.borradores = {};
        for (const dia of ganancias.dias) {
          this.borradores[dia.fecha] = dia.monto;
        }
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar la planilla. ¿Está corriendo el backend?';
        this.cargando = false;
      },
    });
  }

  /**
   * Suma de montos desde el día 1 hasta el día indicado (inclusive).
   */
  acumuladoHasta(diaHasta: number): number {
    if (!this.planilla) {
      return 0;
    }
    let total = 0;
    for (const dia of this.planilla.dias) {
      if (dia.dia > diaHasta) {
        break;
      }
      const valor = this.borradores[dia.fecha];
      if (valor !== null && valor !== undefined && !Number.isNaN(Number(valor))) {
        total += Number(valor);
      }
    }
    return total;
  }

  /** Porcentaje recaudado respecto al gasto del mes siguiente (0–100+). */
  porcentajeHasta(diaHasta: number): number {
    if (this.totalGastosSiguiente <= 0) {
      return 0;
    }
    return (this.acumuladoHasta(diaHasta) / this.totalGastosSiguiente) * 100;
  }

  /** Ancho visual de la barra (tope 100%). */
  anchoBarraHasta(diaHasta: number): number {
    return Math.min(this.porcentajeHasta(diaHasta), 100);
  }

  formatearPorcentaje(diaHasta: number): string {
    const pct = this.porcentajeHasta(diaHasta);
    if (!Number.isFinite(pct)) {
      return '0%';
    }
    return `${Math.round(pct)}%`;
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

  /** Días posteriores a hoy: no se puede cargar monto. */
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
    if (this.esFechaFutura(fecha)) {
      return;
    }
    this.fechaActiva = fecha;
  }

  onBlur(dia: DiaGanancia): void {
    this.fechaActiva = null;
    if (this.esFechaFutura(dia.fecha)) {
      return;
    }
    const valor = this.borradores[dia.fecha];
    const montoActual = dia.monto;

    if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
      if (montoActual !== null) {
        this.borrar(dia);
      }
      return;
    }

    const monto = Math.min(Math.floor(Number(valor)), 9_999_999);
    this.borradores[dia.fecha] = monto;
    if (monto === montoActual) {
      return;
    }

    this.guardar(dia.fecha, monto);
  }

  guardar(fecha: string, monto: number): void {
    this.guardando[fecha] = true;
    this.mensaje = '';
    this.gananciasService.upsert(fecha, monto).subscribe({
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
        this.cargar();
      },
      error: () => {
        this.guardando[dia.fecha] = false;
        this.error = `Error al borrar ${dia.fecha}`;
      },
    });
  }
}
