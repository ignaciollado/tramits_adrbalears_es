import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActoAdministrativoDTO } from '../../Models/acto-administrativo-dto';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PrDevinitivaDESFavorable_ConReqService {
  private apiUrl = environment.apiUrl;

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {

  }

  getAll(): Observable<ActoAdministrativoDTO[]> {
    return this.http.get<ActoAdministrativoDTO[]>(`${this.apiUrl}/api/pindust/acto`);
  }

  getById(id: number): Observable<ActoAdministrativoDTO> {
    return this.http.get<ActoAdministrativoDTO>(`${this.apiUrl}/api/pindust/acto/${id}`);
  }

  getByNameAndTipoTramite(name: string, tipoTramite: string): Observable<ActoAdministrativoDTO> {
    return this.http.get<ActoAdministrativoDTO>(`${this.apiUrl}/api/pindust/acto/${name}/${tipoTramite}`);
  }

  create(data: ActoAdministrativoDTO): Observable<any> {
    return this.http.post(this.apiUrl, data, this.httpOptions);
  }

  update(id: number, data: ActoAdministrativoDTO): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/pindust/acto/${id}`, data, this.httpOptions);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/pindust/acto/${id}`);
  }

  getDeleted(): Observable<ActoAdministrativoDTO[]> {
    return this.http.get<ActoAdministrativoDTO[]>(`${this.apiUrl}/api/pindust/acto/deleted`);
  }

  restore(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/api/pindust/acto/restore/${id}`, {}, this.httpOptions);
  }

  sendPDFToBackEnd(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/pindust/pdf/upload`, formData);
  }

  sendDecRespSolPDFToBackEnd(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/pindust/pdf/upload-dec-resp-sol`, formData);
  }
}
