import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentoGeneradoDTO } from '../Models/documentos-generados-dto';


@Injectable({
  providedIn: 'root'
})
export class DocumentosGeneradosService {
  private entorno: 'tramits' | 'pre-tramits';
  private readonly urls = {
    'tramits': 'https://tramits.idi.es/public/index.php',
    'pre-tramits': 'https://pre-tramits.idi.es/public/index.php'
  };

    private get apiUrl(): string {
    return this.urls[this.entorno];
  }

  constructor(private http: HttpClient) {
    const entornoGuardado = sessionStorage.getItem('entorno') as 'tramits' | 'pre-tramits';
    this.entorno = entornoGuardado || 'pre-tramits';
  }

  // Obtener todos los documentos
  getAll(): Observable<DocumentoGeneradoDTO[]> {
    return this.http.get<DocumentoGeneradoDTO[]>(`${this.apiUrl}/api/documentos`);
  }

  // Obtener un documento por ID
  getById(id: number): Observable<DocumentoGeneradoDTO> {
    return this.http.get<DocumentoGeneradoDTO>(`${this.apiUrl}/api/documentos/${id}`);
  }

  // Crear un nuevo documento
  create(documento: DocumentoGeneradoDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/documentos`, documento);
  }

  // Actualizar un documento existente
  update(id: number, documento: DocumentoGeneradoDTO): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/documentos/${id}`, documento);
  }

  // Eliminar un documento
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/documentos/${id}`);
  }

  // Preflight OPTIONS (opcional si usas interceptores o configuración global)
  preflight(): Observable<any> {
    const headers = new HttpHeaders({
      'Access-Control-Request-Method': 'GET, POST, PUT, DELETE',
      'Access-Control-Request-Headers': 'Content-Type'
    });
    return this.http.options(`${this.apiUrl}/api/documentos`, { headers });
  }
}
