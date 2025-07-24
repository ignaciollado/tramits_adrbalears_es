
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

  // ENTORNO PREPRODUCCIÓN
  const PRE_REST_API_URL = "https://sandbox.viafirma.com/inbox/api/v3/"
  const PRE_REST_API_KEY = "dev_idi"
  const PRE_REST_API_PASS = "V3CBFZVZS6THXSWZG9HL3AFF06KD4NGAQHGXGF6Y"

	// ENTORNO PRODUCCIÓN
  const REST_API_URL = "https://inbox.viafirma.com/inbox/api/v3/";
  const REST_API_KEY = "viafirma";
  const REST_API_PASS = "HXN91O5HBYNUNGVRVTQKBFXWDLPIOMBPKIBSJNCC";


	const username = 'REST_API_KEY';
  const password = 'REST_API_PASS';

  const credentials = btoa(`${username}:${password}`);
  const headers = new HttpHeaders({
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  @Injectable({
    providedIn: 'root',
  })

export class ViafirmaService { 

  constructor( private http: HttpClient ) { }

getOneSignedDocument(publicAccessId: string): Observable<any> {
  const username = 'REST_API_KEY'; // reemplaza con tu clave
  const password = 'REST_API_PASS'; // reemplaza con tu pass

  const credentials = btoa(`${username}:${password}`);
  const headers = new HttpHeaders({
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/javascript, */*; q=0.01'
  });

  return this.http.get<any>(`${REST_API_URL}requests/${publicAccessId}`, { headers })
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