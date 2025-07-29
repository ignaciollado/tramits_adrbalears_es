import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { PindustLineaAyudaDTO } from '../Models/linea-ayuda-dto';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PindustLineaAyudaService {
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

  /* CRUD Linea ayuda XECS */
  getAll(): Observable<PindustLineaAyudaDTO[]> {
    return this.http.get<PindustLineaAyudaDTO[]>(`${this.apiUrl}/api/pindustlineaayuda`)
      .pipe(catchError(this.handleError));
  }

  getById(id: number): Observable<PindustLineaAyudaDTO> {
    return this.http.get<PindustLineaAyudaDTO>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  create(data: PindustLineaAyudaDTO): Observable<PindustLineaAyudaDTO> {
    return this.http.post<PindustLineaAyudaDTO>(this.apiUrl, data)
      .pipe(catchError(this.handleError));
  }

  update(id: number, data: PindustLineaAyudaDTO): Observable<PindustLineaAyudaDTO> {
    return this.http.put<PindustLineaAyudaDTO>(`${this.apiUrl}/${id}`, data)
      .pipe(catchError(this.handleError));
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ha ocurrido un error desconocido.';
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Error del servidor: ${error.status} - ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
