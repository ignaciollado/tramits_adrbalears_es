import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { DocumentoGeneradoDTO } from '../Models/documentos-generados-dto';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DocumentosGeneradosService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {

  }

  // Obtener todos los documentos
  getAll(): Observable<DocumentoGeneradoDTO[]> {
    return this.http.get<DocumentoGeneradoDTO[]>(`${this.apiUrl}/api/documentos`);
  }

  // Obtener un documento por ID
  getById(id: number): Observable<DocumentoGeneradoDTO> {
    return this.http.get<DocumentoGeneradoDTO>(`${this.apiUrl}/api/documentos/${id}`);
  }

  // Obtener un documento por ID
  getDocumentosGenerados( id_sol: number | string, cifnif_propietario: string, convocatoria: number | string, corresponde_documento: string ): Observable<DocumentoGeneradoDTO[]> 
  {
    const params = new HttpParams()
      .set('id_sol', String(id_sol))
      .set('cifnif_propietario', cifnif_propietario)
      .set('convocatoria', String(convocatoria))
      .set('corresponde_documento', corresponde_documento);

    return this.http.get<DocumentoGeneradoDTO[]>(`${this.apiUrl}/api/documentos-generados`,{ params })
      .pipe(map((res:any) => res.data));
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

  deleteByIdSolNifConvoTipoDoc( id_sol: string | number, cifnif_propietario: string, convocatoria: string | number, corresponde_documento: string): Observable<any> {
    const httpParams = new HttpParams()
      .set('id_sol', id_sol)
      .set('cifnif_propietario', cifnif_propietario)
      .set('convocatoria', convocatoria)
      .set('corresponde_documento', corresponde_documento);

    return this.http.delete<any>(`${this.apiUrl}/api/documentos-generados`, { params: httpParams });
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
