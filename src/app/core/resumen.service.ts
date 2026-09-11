import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EvolucionMensual, ResumenMes } from './models';

@Injectable({ providedIn: 'root' })
export class ResumenService {
  private readonly baseUrl = `${environment.apiUrl}/resumen`;

  constructor(private readonly http: HttpClient) {}

  resumenMes(anio: number, mes: number): Observable<ResumenMes> {
    const params = new HttpParams().set('anio', anio).set('mes', mes);
    return this.http.get<ResumenMes>(`${this.baseUrl}/mes`, { params });
  }

  evolucionMensual(meses = 12): Observable<EvolucionMensual> {
    const params = new HttpParams().set('meses', meses);
    return this.http.get<EvolucionMensual>(`${this.baseUrl}/evolucion-mensual`, {
      params,
    });
  }
}
