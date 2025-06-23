import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { ActividadCnaeDTO } from '../Models/actividades-cnae.dto';

@Injectable({
  providedIn: 'root'
})
export class ActividadCnaeService {

  private urlAPI: string;

  constructor(private http: HttpClient) {
    this.urlAPI = "https://pre-tramits.idi.es/public/index.php"
   }

  /* CRUD Actividades CNAE */

    // GET all
    getActividadesCNAE(): Observable<ActividadCnaeDTO[]> {
      return this.http.get<ActividadCnaeDTO[]>(`${this.urlAPI}/pindustactividades`).pipe(catchError(this.handleError))
    }
  
    // GET by ID
    getOneActividadCNAE(id: number): Observable<ActividadCnaeDTO>{
      return this.http.get<ActividadCnaeDTO>(`${this.urlAPI}/pindustactividades/${id}`).pipe(catchError(this.handleError))
    }
  
    // POST
    createActividadCNAE(actividad: ActividadCnaeDTO): Observable<ActividadCnaeDTO>{
      return this.http.post<ActividadCnaeDTO>(`${this.urlAPI}`, actividad).pipe(catchError(this.handleError))
    }
  
    // PUT
    updateActividadCNAE(id: number, actividad: ActividadCnaeDTO): Observable<ActividadCnaeDTO>{
      return this.http.put<ActividadCnaeDTO>(`${this.urlAPI}/${id}`, actividad).pipe(catchError(this.handleError))
    }
  
    // DELETE
    deleteActividadCNAE(id: number): Observable<void>{
      return this.http.delete<void>(`${this.urlAPI}/${id}`).pipe(catchError(this.handleError))
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
