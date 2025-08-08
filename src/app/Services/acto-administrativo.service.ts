import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ActoAdministrativo {
  id?: number;
  denominacion: string;
  tipo_tramite: string;
  texto: string;
  texto_es: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

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
    const entornoGuardado = localStorage.getItem('entorno') as 'pre-tramits' | 'tramits';
    this.entorno = entornoGuardado || 'pre-tramits';
  }

  setEntorno(entorno: 'pre-tramits' | 'tramits'): void {
    this.entorno = entorno;
    localStorage.setItem('entorno', entorno);
  }

  private get apiUrl(): string {
    return this.urls[this.entorno];
  }



  getAll(): Observable<ActoAdministrativo[]> {
    return this.http.get<ActoAdministrativo[]>(`${this.apiUrl}/api/pindust/acto`);
  }

  getById(id: number): Observable<ActoAdministrativo> {
    return this.http.get<ActoAdministrativo>(`${this.apiUrl}/api/pindust/acto/${id}`);
  }

    getByNameAndTipoTramite(name: string, tipoTramite: string): Observable<ActoAdministrativo> {
    return this.http.get<ActoAdministrativo>(`${this.apiUrl}/api/pindust/acto/${name}/${tipoTramite}`);
  }

  create(data: ActoAdministrativo): Observable<any> {
    return this.http.post(this.apiUrl, data, this.httpOptions);
  }

  update(id: number, data: ActoAdministrativo): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/pindust/acto/${id}`, data, this.httpOptions);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/pindust/acto/${id}`);
  }

  getDeleted(): Observable<ActoAdministrativo[]> {
    return this.http.get<ActoAdministrativo[]>(`${this.apiUrl}/api/pindust/acto/deleted`);
  }

  restore(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/api/pindust/acto/restore/${id}`, {}, this.httpOptions);
  }

  sendPDFToBackEnd(formData: FormData): Observable<any> {
    console.log ("formdata", formData)
    return this.http.post(`${this.apiUrl}/api/pindust/pdf/upload`, formData);
  }
}
