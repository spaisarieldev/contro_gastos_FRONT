import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateGastoPayload,
  Gasto,
  PlanillaGastos,
  UpdateGastoPayload,
} from './models';

@Injectable({ providedIn: 'root' })
export class GastosService {
  private readonly baseUrl = `${environment.apiUrl}/gastos`;

  constructor(private readonly http: HttpClient) {}

  listarMes(anio: number, mes: number): Observable<PlanillaGastos> {
    const params = new HttpParams().set('anio', anio).set('mes', mes);
    return this.http.get<PlanillaGastos>(this.baseUrl, { params });
  }

  crear(payload: CreateGastoPayload): Observable<Gasto> {
    return this.http.post<Gasto>(this.baseUrl, payload);
  }

  actualizar(id: number, payload: UpdateGastoPayload): Observable<Gasto> {
    return this.http.put<Gasto>(`${this.baseUrl}/${id}`, payload);
  }

  togglePagado(id: number, pagado: boolean): Observable<Gasto> {
    return this.http.patch<Gasto>(`${this.baseUrl}/${id}/pagado`, { pagado });
  }

  eliminar(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.baseUrl}/${id}`);
  }
}
