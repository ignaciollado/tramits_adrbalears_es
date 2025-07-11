import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExpedienteDocumentoService {
  urlAPITramits: string;

  constructor(private http: HttpClient) {
    this.urlAPITramits = "https://pre-tramits.idi.es/public/index.php"
  }

  /* CRUD Documentos Expediente */

  // GET documentos de un expediente por id_sol
  getDocumentosExpediente(id: number): Observable<any> {
    return this.http.get<any[]>(`${this.urlAPITramits}pindustdocument/expediente/${id}`).pipe(catchError(this.handleError))
  }

  // CREATE
  createDocumentoExpediente(fileData: any[], data: any, documentType: string): Observable<any> {
    console.log ("recibido en create doc", fileData, data)
  const payload = {
   /*  ...fileData, */
    id_sol: data.id_sol,
    cifnif_propietario: data.nif,
    convocatoria: data.convocatoria,
    name: fileData[0].name,
    type: fileData[0].type,
    tipo_tramite: data.tipo_tramite,
    corresponde_documento: documentType,
    selloDeTiempo: data.selloDeTiempo,
    fase_exped: "Solicitud",
    docRequerido: "SI",
  };

  return this.http.post<any>(`${this.urlAPITramits}/pindustdocument/create`, payload)
    .pipe(catchError(this.handleError));
  }

  // UPDATE
/*   updateExpediente(id: number, expediente: any): Observable<any> {
    return this.http.put<any>(`${this.urlAPITramits}/pindustexpediente/update/${id}`, expediente).pipe(catchError(this.handleError))
  } */

  // DELETE
/*   deleteExpediente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlAPITramits}/pindustexpediente/delete/${id}`)
    .pipe(catchError(this.handleError))
  }
 */


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
