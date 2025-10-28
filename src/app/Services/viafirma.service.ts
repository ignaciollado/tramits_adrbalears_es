
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { DocSignedDTO } from '../Models/docsigned.dto';
import { CreateSignatureRequest, SignatureResponse } from '../Models/signature.dto';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})

export class ViafirmaService {
  
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /** 
   * Obtiene el estado de firma de un documento enviado a VIAFIRMA
  */
  getDocumentStatus(publicAccessId: string): Observable<DocSignedDTO> {
    return this.http.get<DocSignedDTO>(`${this.apiUrl}/api/viafirma/request/${publicAccessId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Visualiza un documento  
  */

  viewDocument(publicAccessId: string): Observable<DocSignedDTO> {
    return this.http.get<DocSignedDTO>(`${this.apiUrl}/api/viafirma/viewDoc/${publicAccessId}`)
      .pipe(catchError(this.handleError));
  }

  /**
  * Crea una solicitud de firma en el backend.
  * POST /api/signature-request
  */
  createSignatureRequest(payload: CreateSignatureRequest): Observable<SignatureResponse> {
    const url = `${this.apiUrl}/api/signature-request`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<SignatureResponse>(url, payload, { headers }).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }


  createSignatureRequestDecResp(payload: CreateSignatureRequest): Observable<SignatureResponse> {
    const url = `${this.apiUrl}/api/dec-resp-sol-signature-request`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<SignatureResponse>(url, payload, { headers }).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  /**
  * Peticiones creadas. Método para obtener el número de peticones creadas en un periodo dado 
  */
  countCreatedSignatureRequest(initDate: string, endDate: string): Observable<any> {
    const url = `${this.apiUrl}/api/viafirma/stats-requests-new/${initDate}/${endDate}`
    return this.http.get<SignatureResponse>(url).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
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