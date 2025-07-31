
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { DocSignedDTO } from '../Models/docsigned.dto';

const tramitsURL = 'https://tramits.idi.es/public/index.php'

  @Injectable({
    providedIn: 'root',
  })

export class ViafirmaService { 
  private entorno: 'tramits' | 'pre-tramits';
  private readonly urls = {
    'tramits': 'https://tramits.idi.es/public/index.php',
    'pre-tramits': 'https://pre-tramits.idi.es/public/index.php'
  };

  constructor(private http: HttpClient) {
    const entornoGuardado = sessionStorage.getItem('entorno') as 'tramits' | 'pre-tramits';
    this.entorno = entornoGuardado || 'pre-tramits';
  }

/*   setEntorno(entorno: 'pre-tramits' | 'tramits'): void {
    this.entorno = entorno;
    sessionStorage.setItem('entorno', entorno);
    console.log ("entorno actual: ", this.entorno)
  }
 */
  
  private get apiUrl(): string {
    return this.urls[this.entorno];
  }

  getDocumentStatus(publicAccessId: string): Observable<DocSignedDTO> {
    return this.http.get<DocSignedDTO>(`${this.apiUrl}/api/viafirma/request/${publicAccessId}`)
    .pipe(catchError(this.handleError));
  }

  viewDocument(publicAccessId: string): Observable<DocSignedDTO> {
    return this.http.get<DocSignedDTO>(`${this.apiUrl}/api/viafirma/viewDoc/${publicAccessId}`)
    .pipe(catchError(this.handleError));
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