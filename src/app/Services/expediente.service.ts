import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExpedienteService {
  urlAPITramits: string;

  constructor(private http: HttpClient) {
    this.urlAPITramits = "https://pre-tramits.idi.es/public/index.php"
  }

  /* CRUD Expedientes */

  // GET all
  getAllExpedientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlAPITramits}/pindustexpediente`).pipe(catchError(this.handleError))
  }

  // GET by ID
  getOneExpediente(id: number): Observable<any> {
    return this.http.get<any[]>(`${this.urlAPITramits}/pindustexpediente/${id}`).pipe(catchError(this.handleError))
  }

  // GET by Convocatoria
  getExpedientesByConvocatoria(convocatoria: number): Observable<any> {
    return this.http.get<any>(`${this.urlAPITramits}/pindustexpediente/convocatoria/${convocatoria}`).pipe(catchError(this.handleError))
  }

  // GET last ID
  getLastExpedienteIdByProgram(programa: string): Observable<any> {
    return this.http.get<any>(`${this.urlAPITramits}/pindustexpediente/last-id/${programa}`).pipe(catchError(this.handleError))
  }

    // GET last ID XECS
  getLastExpedienteIdXECS(convo: number): Observable<any> {
    return this.http.get<any>(`${this.urlAPITramits}/pindustexpediente/last-id-xecs/${convo}`).pipe(catchError(this.handleError))
  }

  // GET by Convocatoria y tipo trámite
  getExpedientesByConvocatoriaAndTipoTramite(convocatoria: number, tipo_tramite?: string): Observable<any> {
    return this.http.get<any[]>(`${this.urlAPITramits}/pindustexpediente/convocatoria/${convocatoria}?tipo_tramite=${tipo_tramite}`).pipe(catchError(this.handleError))
  }

  // CREATE
  createExpediente(expediente: any): Observable<any> {
    return this.http.post<any>(`${this.urlAPITramits}/pindustexpediente/create`, expediente)
    .pipe(catchError(this.handleError))
  }

  // UPDATE
  updateExpediente(id: number, expediente: any): Observable<any> {
    return this.http.put<any>(`${this.urlAPITramits}/pindustexpediente/update/${id}`, expediente).pipe(catchError(this.handleError))
  }

  // DELETE
  deleteExpediente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlAPITramits}/pindustexpediente/delete/${id}`)
    .pipe(catchError(this.handleError))
  }



private handleError(error: HttpErrorResponse) {
  let errorMessage = 'Error desconocido';

  if (error.status === 400 && error.error?.messages?.error) {
    try {
      const parsedError = JSON.parse(error.error.messages.error);

      errorMessage = parsedError.message || errorMessage;

      const detailedErrors = parsedError.errores_detallados;
      const receivedData = parsedError.datos_recibidos;

      return throwError({
        status: error.status,
        message: errorMessage,
        errores_detallados: detailedErrors,
        datos_recibidos: receivedData
      });
    } catch (err) {
      errorMessage = 'Error al procesar la respuesta del servidor';
    }
  } else if (error.error instanceof ErrorEvent) {
    // Error del lado del cliente
    errorMessage = `Error del cliente: ${error.error.message}`;
  } else {
    // Error del servidor sin estructura esperada
    errorMessage = `Código: ${error.status}\nMensaje: ${error.message}`;
  }

  return throwError({ status: error.status, message: errorMessage });
}

}
