import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PlanillaGanancias } from './models';

@Injectable({ providedIn: 'root' })
export class GananciasService {
  private readonly baseUrl = `${environment.apiUrl}/ganancias`;

  constructor(private readonly http: HttpClient) {}

  listarMes(anio: number, mes: number): Observable<PlanillaGanancias> {
    const params = new HttpParams().set('anio', anio).set('mes', mes);
    return this.http.get<PlanillaGanancias>(this.baseUrl, { params });
  }

  upsert(
    fecha: string,
    monto: number,
    viajes: number | null,
  ): Observable<{ id: number; fecha: string; monto: number; viajes: number | null }> {
    return this.http.put<{ id: number; fecha: string; monto: number; viajes: number | null }>(
      this.baseUrl,
      { fecha, monto, viajes },
    );
  }

  eliminar(fecha: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.baseUrl}/${fecha}`);
  }
}
