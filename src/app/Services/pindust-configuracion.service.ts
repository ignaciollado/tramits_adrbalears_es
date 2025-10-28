import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigurationModelDTO } from '../Models/configuration.dto';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PindustConfiguracionService {
  private apiUrl = environment.apiUrl

  constructor(private http: HttpClient) { }

  getAll(): Observable<ConfigurationModelDTO[]> {
    return this.http.get<ConfigurationModelDTO[]>(`${this.apiUrl}/api/pindustconfiguracion`);
  }

  getById(id: number): Observable<ConfigurationModelDTO> {
    return this.http.get<ConfigurationModelDTO>(`${this.apiUrl}/api/pindustconfiguracion/${id}`);
  }

  getActive(): Observable<ConfigurationModelDTO[]> {
    return this.http.get<ConfigurationModelDTO[]>(`${this.apiUrl}/api/pindustconfiguracion/active`);
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