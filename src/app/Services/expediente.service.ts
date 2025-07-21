import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExpedienteService {
  private entorno: 'tramits' | 'pre-tramits';
  private readonly urls = {
    'tramits': 'https://tramits.idi.es/public/index.php',
    'pre-tramits': 'https://pre-tramits.idi.es/public/index.php'
  };

  constructor(private http: HttpClient) {
    const entornoGuardado = localStorage.getItem('entorno') as 'tramits' | 'pre-tramits';
    this.entorno = entornoGuardado || 'tramits';
  }

  setEntorno(entorno: 'tramits' | 'pre-tramits'): void {
    this.entorno = entorno;
    localStorage.setItem('pre-entorno', entorno);
  }

  private get apiUrl(): string {
    return this.urls[this.entorno];
  }

  /* CRUD Expedientes */

  getAllExpedientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pindustexpediente`).pipe(catchError(this.handleError));
  }

  getOneExpediente(id: number): Observable<any> {
    return this.http.get<any[]>(`${this.apiUrl}/pindustexpediente/${id}`).pipe(catchError(this.handleError));
  }

  getExpedientesByConvocatoria(convocatoria: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/pindustexpediente/convocatoria/${convocatoria}`).pipe(catchError(this.handleError));
  }

  getLastExpedienteIdByProgram(programa: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/pindustexpediente/last-id/${programa}`).pipe(catchError(this.handleError));
  }

  getLastExpedienteIdXECS(convo: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/pindustexpediente/last-id-xecs/${convo}`).pipe(catchError(this.handleError));
  }

  getExpedientesByConvocatoriaAndTipoTramite(convocatoria: number, tipo_tramite?: string): Observable<any> {
    return this.http.get<any[]>(`${this.apiUrl}/pindustexpediente/convocatoria/${convocatoria}?tipo_tramite=${tipo_tramite}`).pipe(catchError(this.handleError));
  }

  getTotalNumberOfApplicationsFromSolicitor(nif: string, tipo_tramite: string, convocatoria: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/pindustexpediente/totalNumberOfApplications/${nif}/${tipo_tramite}/${convocatoria}`).pipe(catchError(this.handleError));
  }

  createExpediente(expediente: any): Observable<any> {
    const testAPIURL = "https://pre-tramits.idi.es/public/index.php"
    return this.http.post<any>(`${testAPIURL}/pindustexpediente/create`, expediente).pipe(catchError(this.handleError));
  }

  updateExpediente(id: number, expediente: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/pindustexpediente/update/${id}`, expediente).pipe(catchError(this.handleError));
  }

  deleteExpediente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/pindustexpediente/delete/${id}`).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error desconocido';

    if (error.status === 400 && error.error?.messages?.error) {
      try {
        const parsedError = JSON.parse(error.error.messages.error);
        errorMessage = parsedError.message || errorMessage;

        return throwError({
          status: error.status,
          message: errorMessage,
          errores_detallados: parsedError.errores_detallados,
          datos_recibidos: parsedError.datos_recibidos
        });
      } catch (err) {
        errorMessage = 'Error al procesar la respuesta del servidor';
      }
    } else if (error.error instanceof ErrorEvent) {
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      errorMessage = `Código: ${error.status}\nMensaje: ${error.message}`;
    }

    return throwError({ status: error.status, message: errorMessage });
  }
}
