import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';


export interface ClassificationResponse {
  classification: string;
  confidence: number;
  keyFields: Record<string, unknown>;
  meta: {
    pages?: number | null;
    bytes?: number;
    mime?: string;
    filename?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /* En la BBDD */
  getDocuments(nif: string, timestamp: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pindustdocument/${nif}/${timestamp}`)
      .pipe(catchError(this.handleError));
  }

  /* En el sistema de archivos del servidor backend */
  listDocuments(idSol: number, isRequiredDoc: string = 'SI', faseExped?: string): Observable<any[]> {
    let url = `${this.apiUrl}/documents/${idSol}`;

    if (isRequiredDoc) {
      url += `/${isRequiredDoc}`;
    }

    if (faseExped) {
      url += `/${faseExped}`;
    }

    return this.http.get<any[]>(url).pipe(
      catchError(this.handleError)
    );
  }

  // Servidor
  createDocument(nif:string, timestamp: string, formData: FormData, idSol?: number, isRequired?: string): Observable<HttpEvent<any>> {
    return this.http.post<any>(`${this.apiUrl}/document/upload/${nif}/${timestamp}/${idSol}/${isRequired}`, formData, {
      reportProgress: true, observe: 'events'})
      .pipe(catchError(this.handleError));
  }

  deleteDocument(folderName: string, id: string, docName: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/documents/delete/${folderName}/${id}/${docName}`)
      .pipe(catchError(this.handleError));
  }

  viewDocument(nif: string, timeStamp: string, docName: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/documents/view/${nif}/${timeStamp}/${docName}`)
      .pipe(catchError(this.handleError));
  }

  classifyDocument(nif:string, timeStamp: string, name: string, extension: string): Observable<ClassificationResponse> {
    const form = new FormData();
    form.append('nif', nif);
    form.append('timeStamp', timeStamp);
    form.append('name', name);
    form.append('extension', extension);

    return this.http.post<ClassificationResponse>(`${this.apiUrl}/api/documents/classify`, form).pipe(
      // Reintenta errores transitorios (p.ej., 502/503). Ajusta el número de reintentos.
      retry({ count: 1, delay: 300 }),
      // Si quieres transformar o validar la respuesta antes de exponerla:
      map(res => {
        // Validación ligera
        if (!res || typeof res.classification !== 'string') {
          throw new Error('Respuesta inválida del servidor');
        }
        return res;
      }),
      catchError((err: HttpErrorResponse | Error) => {
               // Normaliza el error a un mensaje entendible
        const message =
          err instanceof HttpErrorResponse
            ? `[${err.status}] ${err.statusText || 'Error HTTP'}: ${err.error?.message ?? err.message}`
            : err.message;
        return throwError(() => new Error(message));
      })
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = '¡Error desconocido!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Código: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(errorMessage);
  }
}