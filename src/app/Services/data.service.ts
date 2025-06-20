import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private urlAPIMock: string;

  constructor(private http: HttpClient) {
    this.urlAPIMock = '../../assets/json'
  }

  // IAE
  getAllMockIAE(): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlAPIMock}/epigrafeIAE.json`).pipe(
      catchError(error => {
        console.error('Error en getAllMockIAE(): ', error)
        return throwError(() => error)
      })
    )
  }
}
