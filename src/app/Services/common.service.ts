import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { ZipCodesIBDTO } from '../Models/zip-codes-ib.dto';

@Injectable({
  providedIn: 'root',
})
export class CommonService {

  private urlAPIMock: string;
  private urlAPI: string

  constructor(private http: HttpClient) {
    this.urlAPIMock = '../../assets/mocks/';
    this.urlAPI = "https://data.ibrelleu.es/public/index.php"
  }



  // CRUD ZipCode
  getZipCodes(): Observable<ZipCodesIBDTO[]> {
    return this.http.get<ZipCodesIBDTO[]>(`${this.urlAPI}/zipcodes`)
    .pipe(catchError(this.handleError))
  }

  getOneZipCode(id: number): Observable<ZipCodesIBDTO> {
    return this.http.get<ZipCodesIBDTO>(`${this.urlAPI}/zipcodes/${id}`).pipe(catchError(this.handleError))
  }

  createZipCode(zipCode: ZipCodesIBDTO): Observable<ZipCodesIBDTO> {
    return this.http.post<ZipCodesIBDTO>(`${this.urlAPI}/zipcodes/create`, zipCode).pipe(catchError(this.handleError))
  }

  updateZipCode(id: number, zipCode: ZipCodesIBDTO): Observable<ZipCodesIBDTO> {
    return this.http.put<ZipCodesIBDTO>(`${this.urlAPI}/zipcodes/update/${id}`, zipCode).pipe(catchError(this.handleError))
  }

  deleteZipCode(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlAPI}/zipcodes/delete/${id}`).pipe(catchError(this.handleError))
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