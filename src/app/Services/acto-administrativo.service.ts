import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActoAdministrativoDTO } from '../Models/acto-administrativo-dto';
import { environment } from '../../environments/environment';
import { PindustLineaAyudaService } from './linea-ayuda.service';
import { PindustConfiguracionService } from './pindust-configuracion.service';
import { PindustLineaAyudaDTO } from '../Models/linea-ayuda-dto';
import { ConfigurationModelDTO } from '../Models/configuration.dto';

@Injectable({
  providedIn: 'root'
})
export class ActoAdministrativoService {
  private apiUrl = environment.apiUrl;

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient, private lineaAyuda: PindustLineaAyudaService, private configGlobal: PindustConfiguracionService,) {  }

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
  
  getLineDetail(convocatoria: number): Observable<any> {
    return this.lineaAyuda.getAll().pipe(
      map((lineaAyudaItems: PindustLineaAyudaDTO[]) => {
        const filtered = lineaAyudaItems.filter((item: PindustLineaAyudaDTO) => {
          return item.convocatoria === convocatoria && item.lineaAyuda === "XECS" && item.activeLineData === "SI";
        });
        return filtered.length > 0 ? filtered[0] : '';
      })
    );
  }
  
  getGlobalConfig(): Observable<any> {
    return this.configGlobal.getActive().pipe(
      map((globalConfigArr: ConfigurationModelDTO[]) => {
        const globalConfig = globalConfigArr[0];
        return globalConfig ?? '';
      })
    );
  } 
}
