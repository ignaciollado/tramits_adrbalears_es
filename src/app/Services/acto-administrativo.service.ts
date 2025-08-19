import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActoAdministrativoDTO } from '../Models/acto-administrativo-dto';


@Injectable({
  providedIn: 'root'
})
export class ActoAdministrativoService {
  private entorno: 'pre-tramits' | 'tramits';

  private readonly urls = {
    'tramits': 'https://tramits.idi.es/public/index.php',
    'pre-tramits': 'https://pre-tramits.idi.es/public/index.php'
  };

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {
    /* Me está dando error CORS debido a que nunca coge el entorno pre-tramits en desarrollo. Utilizo sessionStorage para poder ver los documentos */
    // const entornoGuardado = localStorage.getItem('entorno') as 'pre-tramits' | 'tramits'; Me da error en desarrollo debido a que está cogiendo tramits pero nunca coge pre-tramits
    const entornoGuardado = sessionStorage.getItem('entorno') as 'pre-tramits' | 'tramits';
    this.entorno = entornoGuardado || 'pre-tramits';
  }

  // Creo que es innecesario, debido a que el slider de entornos utiliza el servicio de expedientes
  setEntorno(entorno: 'pre-tramits' | 'tramits'): void {
    this.entorno = entorno;
    localStorage.setItem('entorno', entorno);
  }

  private get apiUrl(): string {
    return this.urls[this.entorno];
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
}
