import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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
    return this.http.delete<any>(`${this.apiUrl}/documents/view/${nif}/${timeStamp}/${docName}`)
      .pipe(catchError(this.handleError));
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