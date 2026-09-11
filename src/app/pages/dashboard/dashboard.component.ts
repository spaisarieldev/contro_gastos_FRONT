import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { ResumenService } from '../../core/resumen.service';
import { EvolucionMensual, ResumenMes } from '../../core/models';
import {
  etiquetarMes,
  formatearDinero,
  mesAnterior,
  mesSiguiente,
} from '../../core/date-utils';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  anio = new Date().getFullYear();
  mes = new Date().getMonth() + 1;
  resumen: ResumenMes | null = null;
  evolucion: EvolucionMensual | null = null;
  cargando = false;
  error = '';

  chartDiario: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  chartMensual: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) =>
            typeof value === 'number'
              ? new Intl.NumberFormat('es-AR', {
                  notation: 'compact',
                  compactDisplay: 'short',
                }).format(value)
              : value,
        },
      },
    },
  };

  constructor(private readonly resumenService: ResumenService) {}

  ngOnInit(): void {
    this.cargar();
  }

  get tituloMes(): string {
    return etiquetarMes(this.anio, this.mes);
  }

  formatear = formatearDinero;

  cargar(): void {
    this.cargando = true;
    this.error = '';

    this.resumenService.resumenMes(this.anio, this.mes).subscribe({
      next: (data) => {
        this.resumen = data;
        this.chartDiario = {
          labels: data.evolucionDiaria.map((d) => String(d.dia)),
          datasets: [
            {
              data: data.evolucionDiaria.map((d) => d.monto),
              label: 'Ganancia diaria',
              backgroundColor: 'rgba(13, 110, 253, 0.65)',
              borderRadius: 4,
            },
          ],
        };
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el resumen. ¿Está corriendo el backend?';
        this.cargando = false;
      },
    });

    this.resumenService.evolucionMensual(12).subscribe({
      next: (data) => {
        this.evolucion = data;
        this.chartMensual = {
          labels: data.meses.map((m) => m.etiqueta),
          datasets: [
            {
              data: data.meses.map((m) => m.totalGanancias),
              label: 'Ganancias',
              backgroundColor: 'rgba(25, 135, 84, 0.7)',
              borderRadius: 4,
            },
            {
              data: data.meses.map((m) => m.totalGastos),
              label: 'Gastos',
              backgroundColor: 'rgba(220, 53, 69, 0.65)',
              borderRadius: 4,
            },
          ],
        };
      },
      error: () => {
        // El error principal ya se muestra con el resumen del mes
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

  claseBalance(valor: number): string {
    if (valor > 0) return 'positivo';
    if (valor < 0) return 'negativo';
    return '';
  }
}
