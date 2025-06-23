import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEvent, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'multipart/form-data',
  })
};

@Injectable({
  providedIn: 'root'
})
export class DocumentService {

  private apiUrl = 'https://pre-tramits.idi.es/public/index.php';

  constructor(private http: HttpClient) { }

  uploadDocuments(foldername: string, id: number, formData: FormData): Observable<HttpEvent<any>> {
    return this.http.post<any>(`${this.apiUrl}/api/documents/upload/${foldername}/${id}`, formData, {
      reportProgress: true,
      observe: 'events'})
      .pipe(catchError(this.handleError));
  }

  getDocuments(foldername: string, id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/documents/${foldername}/${id}`)
      .pipe(catchError(this.handleError));
  }

  viewDocument(path: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/documents/view/${path}`)
    .pipe(catchError(this.handleError));
  }

  deleteDocument(folderName: string, id: number, docName: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/documents/delete/${folderName}/${id}/${docName}`)
      .pipe(catchError(this.handleError));
  }

  /* CRUD Documentos Front */

  // GET ALL
  getAllDocumentsFront(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pindustdocumento`).pipe(catchError(this.handleError))
  }

  // GET by ID
  getOneDocumentFront(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/pindustdocumento/${id}`).pipe(catchError(this.handleError))
  }

  // GET by ID Expediente
  getAllDocumentsByExpediente(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pindustdocumento/expediente/${id}`).pipe(catchError(this.handleError))
  }

  // POST
  createDocumentFront(document: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/pindustdocumento/create`, document).pipe(catchError(this.handleError))
  }

  // PUT
  updateDocumentFront(id: number, document: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/pindustdocumento/update/${id}`, document).pipe(catchError(this.handleError))
  }

  // DELETE
  deleteDocumentFront(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/pindustdocumento/delete/${id}`).pipe(catchError(this.handleError))
  }

  /* CRUD Documentos Back */
  
  // GET All
  getAllDocumentsBack(nif: string, timestamp: string): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/documents/${nif}/${timestamp}`).pipe(catchError(this.handleError))
  }

  // POST
  createDocumentBack(nif: string, timestamp: string, document: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/upload/${nif}/${timestamp}`, document).pipe(catchError(this.handleError))
  }

  // DELETE
  deleteDocumentBack(nif: string, timestamp: string, filename: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${nif}/${timestamp}/${filename}`).pipe(catchError(this.handleError))
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
