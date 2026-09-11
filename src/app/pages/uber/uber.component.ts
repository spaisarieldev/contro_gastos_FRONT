import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GananciasService } from '../../core/ganancias.service';
import { DiaGanancia, PlanillaGanancias } from '../../core/models';
import {
  etiquetarMes,
  formatearDinero,
  mesAnterior,
  mesSiguiente,
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

  constructor(private readonly gananciasService: GananciasService) {}

  ngOnInit(): void {
    this.cargar();
  }

  get tituloMes(): string {
    return etiquetarMes(this.anio, this.mes);
  }

  get totalFormateado(): string {
    return formatearDinero(this.planilla?.total ?? 0);
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.gananciasService.listarMes(this.anio, this.mes).subscribe({
      next: (data) => {
        this.planilla = data;
        this.borradores = {};
        for (const dia of data.dias) {
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
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = String(hoy.getMonth() + 1).padStart(2, '0');
    const d = String(hoy.getDate()).padStart(2, '0');
    return fecha === `${y}-${m}-${d}`;
  }

  onBlur(dia: DiaGanancia): void {
    const valor = this.borradores[dia.fecha];
    const montoActual = dia.monto;

    if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
      if (montoActual !== null) {
        this.borrar(dia);
      }
      return;
    }

    const monto = Number(valor);
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
        this.mensaje = `Guardado ${fecha}`;
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
