import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigurationModelDTO } from '../Models/configuration.dto';


@Injectable({
  providedIn: 'root'
})
export class PindustConfiguracionService {
  private entorno: 'tramits' | 'pre-tramits';
  private readonly urls = {
    'tramits': 'https://tramits.idi.es/public/index.php',
    'pre-tramits': 'https://pre-tramits.idi.es/public/index.php'
  };
   
  constructor(private http: HttpClient) {
    const entornoGuardado = sessionStorage.getItem('entorno') as 'tramits' | 'pre-tramits';
    this.entorno = entornoGuardado || 'pre-tramits';
  }

  private get apiUrl(): string {
    return this.urls[this.entorno];
  }

  getAll(): Observable<ConfigurationModelDTO[]> {
    return this.http.get<ConfigurationModelDTO[]>(`${this.apiUrl}/api/pindustconfiguracion`);
  }

  getById(id: number): Observable<ConfigurationModelDTO> {
    return this.http.get<ConfigurationModelDTO>(`${this.apiUrl}/api/pindustconfiguracion/${id}`);
  }

  create(data: ConfigurationModelDTO): Observable<ConfigurationModelDTO> {
    return this.http.post<ConfigurationModelDTO>(`${this.apiUrl}/api/pindustconfiguracion`, data);
  }

  update(id: number, data: ConfigurationModelDTO): Observable<ConfigurationModelDTO> {
    return this.http.put<ConfigurationModelDTO>(`${this.apiUrl}/api/pindustconfiguracion/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/pindustconfiguracion/${id}`);
  }

  sendPreflight(): Observable<any> {
    const headers = new HttpHeaders({
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Content-Type'
    });
    return this.http.options(this.apiUrl, { headers });
  }
}