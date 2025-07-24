
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { DocSignedDTO } from '../Models/docsigned.dto';

const tramitsURL = 'https://tramits.idi.es/public/index.php'

  @Injectable({
    providedIn: 'root',
  })

export class ViafirmaService { 

  constructor( private http: HttpClient ) { }

getData(publicAccessId: string): Observable<DocSignedDTO> {
  return this.http.get<DocSignedDTO>(`${tramitsURL}/api/viafirma/request/${publicAccessId}`)
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