import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PindustLineaAyudaDTO } from '../Models/linea-ayuda-dto';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PindustLineaAyudaService {
  private apiUrl = environment.apiUrl;


  constructor(private http: HttpClient) { }

  /* CRUD Linea ayuda XECS */
  getAll(): Observable<PindustLineaAyudaDTO[]> {
    return this.http.get<PindustLineaAyudaDTO[]>(`${this.apiUrl}/api/pindustlineaayuda`)
    
  }

  getById(id: number): Observable<PindustLineaAyudaDTO> {
    return this.http.get<PindustLineaAyudaDTO>(`${this.apiUrl}/api/pindustlineaayuda/${id}`)
    
  }

  create(data: PindustLineaAyudaDTO): Observable<PindustLineaAyudaDTO> {
    return this.http.post<PindustLineaAyudaDTO>(`${this.apiUrl}/api/pindustlineaayuda`, data)
     
  }

  update(id: number, data: PindustLineaAyudaDTO): Observable<PindustLineaAyudaDTO> {
    return this.http.put<PindustLineaAyudaDTO>(`${this.apiUrl}/api/pindustlineaayuda/${id}`, data)
      
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`)

  }

}
