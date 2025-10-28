import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MejoraSolicitudDTO } from '../Models/mejoras-solicitud-dto';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MejorasSolicitudService {
  private apiUrl = environment.apiUrl

  constructor(private http: HttpClient) { }

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
      // 'Authorization': `Bearer ${token}` si se usa JWT
    })
  };

  // 🔍 Obtener todas las solicitudes
  getMejorasSolicitudes(): Observable<MejoraSolicitudDTO[]> {
    return this.http.get<MejoraSolicitudDTO[]>(`${this.apiUrl}/api/mejoras-solicitud`);
  }

  // 🔍 Obtener una solicitud por ID
  getMejorasSolicitud(id: number): Observable<MejoraSolicitudDTO[]> {
    return this.http.get<MejoraSolicitudDTO[]>(`${this.apiUrl}/api/mejoras-solicitud/${id}`);
  }

  // cuenta cuantas mejoras tiene la solicitud
  countMejorasSolicitud(id: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/api/mejoras-solicitud/${id}/count`)
  }

   obtenerUltimaMejoraSolicitud(id: number): Observable<MejoraSolicitudDTO> {
    return this.http.get<MejoraSolicitudDTO>(`${this.apiUrl}/api/mejoras-solicitud/${id}/lastone`)
  }

  // 📝 Crear una nueva solicitud
  createMejoraSolicitud(data: MejoraSolicitudDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/mejoras-solicitud`, data, this.httpOptions);
  }

  // ✏️ Actualizar una solicitud existente
  updateMejoraSolicitud(id: number, data: MejoraSolicitudDTO): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/mejoras-solicitud/${id}`, data, this.httpOptions);
  }

  // 🗑️ Eliminar una solicitud
  deleteMejoraSolicitud(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/mejoras-solicitud/${id}`, this.httpOptions);
  }
}