import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GastosService } from '../../core/gastos.service';
import {
  CreateGastoPayload,
  Gasto,
  PlanillaGastos,
  TipoGasto,
} from '../../core/models';
import {
  etiquetarMes,
  formatearDinero,
  formatearFechaDisplay,
  mesAnterior,
  mesSiguiente,
} from '../../core/date-utils';

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gastos.component.html',
  styleUrl: './gastos.component.scss',
})
export class GastosComponent implements OnInit {
  anio = new Date().getFullYear();
  mes = new Date().getMonth() + 1;
  planilla: PlanillaGastos | null = null;
  cargando = false;
  error = '';
  guardando = false;

  modalAbierto = false;
  editando: Gasto | null = null;
  form: CreateGastoPayload = this.formVacio();

  constructor(private readonly gastosService: GastosService) {}

  ngOnInit(): void {
    this.cargar();
  }

  get tituloMes(): string {
    return etiquetarMes(this.anio, this.mes);
  }

  formatear = formatearDinero;
  formatearFecha = formatearFechaDisplay;

  private formVacio(): CreateGastoPayload {
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = String(hoy.getMonth() + 1).padStart(2, '0');
    const d = String(hoy.getDate()).padStart(2, '0');
    return {
      descripcion: '',
      monto: 0,
      tipo: 'DIARIO',
      fecha: `${y}-${m}-${d}`,
      pagado: true,
    };
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.gastosService.listarMes(this.anio, this.mes).subscribe({
      next: (data) => {
        this.planilla = data;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar los gastos. ¿Está corriendo el backend?';
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

  abrirNuevo(): void {
    this.editando = null;
    this.form = this.formVacio();
    this.modalAbierto = true;
  }

  abrirEditar(gasto: Gasto): void {
    this.editando = gasto;
    this.form = {
      descripcion: gasto.descripcion,
      monto: gasto.monto,
      tipo: gasto.tipo,
      fecha: gasto.fecha,
      pagado: gasto.pagado,
    };
    this.modalAbierto = true;
  }

  onTipoChange(): void {
    if (this.editando) {
      return;
    }
    // Al cargar un diario, ya se gastó; el resto arranca pendiente
    this.form.pagado = this.form.tipo === 'DIARIO';
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.editando = null;
  }

  guardar(): void {
    if (!this.form.descripcion.trim() || this.form.monto < 0) {
      this.error = 'Completá descripción y monto válido.';
      return;
    }

    this.guardando = true;
    this.error = '';

    if (this.editando) {
      this.gastosService.actualizar(this.editando.id, this.form).subscribe({
        next: () => {
          this.guardando = false;
          this.cerrarModal();
          this.cargar();
        },
        error: () => {
          this.guardando = false;
          this.error = 'Error al actualizar el gasto.';
        },
      });
    } else {
      this.gastosService.crear(this.form).subscribe({
        next: () => {
          this.guardando = false;
          this.cerrarModal();
          this.cargar();
        },
        error: () => {
          this.guardando = false;
          this.error = 'Error al crear el gasto.';
        },
      });
    }
  }

  togglePagado(gasto: Gasto): void {
    this.gastosService.togglePagado(gasto.id, !gasto.pagado).subscribe({
      next: () => this.cargar(),
      error: () => (this.error = 'Error al actualizar pagado.'),
    });
  }

  eliminar(gasto: Gasto): void {
    const aviso =
      gasto.tipo === 'MENSUAL'
        ? `¿Eliminar "${gasto.descripcion}"? También se desactivará para meses futuros.`
        : `¿Eliminar "${gasto.descripcion}"?`;
    if (!confirm(aviso)) {
      return;
    }
    this.gastosService.eliminar(gasto.id).subscribe({
      next: () => this.cargar(),
      error: () => (this.error = 'Error al eliminar.'),
    });
  }

  claseFila(tipo: TipoGasto): string {
    if (tipo === 'MENSUAL') return 'fila-mensual';
    if (tipo === 'DIARIO') return 'fila-diario';
    return 'fila-unico';
  }
}
