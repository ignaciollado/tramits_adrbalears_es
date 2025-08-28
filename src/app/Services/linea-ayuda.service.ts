import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PindustLineaAyudaDTO } from '../Models/linea-ayuda-dto';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PindustLineaAyudaService {
private entorno: 'tramits' | 'pre-tramits';
  private readonly urls = {
    'tramits': 'https://tramits.idi.es/public/index.php',
    'pre-tramits': 'https://pre-tramits.idi.es/public/index.php'
  };

  constructor(private http: HttpClient) {
    const entornoGuardado = sessionStorage.getItem('entorno') as 'tramits' | 'pre-tramits';
    this.entorno = entornoGuardado || 'pre-tramits';
  }

  setEntorno(entorno: 'pre-tramits' | 'tramits'): void {
    this.entorno = entorno;
    sessionStorage.setItem('entorno', entorno);
    console.log ("entorno actual expedientes: ", this.entorno)
  }

  private get apiUrl(): string {
    return this.urls[this.entorno];
  }

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
