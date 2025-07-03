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

  // GET by Convocatoria y tipo trámite
  getExpedientesByConvocatoriaAndTipoTramite(convocatoria: number, tipo_tramite?: string): Observable<any> {
    return this.http.get<any[]>(`${this.urlAPITramits}/pindustexpediente/convocatoria/${convocatoria}?tipo_tramite=${tipo_tramite}`).pipe(catchError(this.handleError))
  }

  // POST
  createExpediente(expediente: any): Observable<any> {
    return this.http.post<any>(`${this.urlAPITramits}/pindustexpediente/create`, expediente).pipe(catchError(this.handleError))
  }

  // PUT
  updateExpediente(id: number, expediente: any): Observable<any> {
    return this.http.put<any>(`${this.urlAPITramits}/pindustexpediente/update/${id}`, expediente).pipe(catchError(this.handleError))
  }

  // DELETE
  deleteExpediente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlAPITramits}/pindustexpediente/delete/${id}`).pipe(catchError(this.handleError))
  }



  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Unknown error!';
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(errorMessage);
  }
}
