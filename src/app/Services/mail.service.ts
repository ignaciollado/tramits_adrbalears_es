// src/app/services/mail.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PindustExpedienteJustificacionDto } from '../Models/pindust-expediente-justificacion-dto';
export interface Advertisement {
  code?: string;
  title?: string;
  codi?: string;
  nomProjecte?: string;
  sector1?: string;
  // añade campos adicionales si los necesitas
}

export interface MatchedAccount {
  id?: number | string | null;
  nombre?: string | null;
  email?: string | null;
  sector_principal?: string | null;
}

export interface SendJustificationResponse {
  message: string;
  solicitud?: Advertisement;
  interestedSendedMail?: string;
  cuentasCoincidentes?: MatchedAccount[];
  correosEnviados?: number;
  erroresEnvio?: Array<{ email: string; error: string }>;
}

export interface ApiSimpleResponse {
  message: string;
  // otros campos genéricos
}

@Injectable({
  providedIn: 'root'
})
export class MailService {
  private base = environment.apiUrl.replace(/\/+$/, ''); // quitar slash final si existe
  private headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  constructor(private http: HttpClient) {}

  /**
   * GET /mail
   */
  getIndex(): Observable<PindustExpedienteJustificacionDto> {
    const url = `${this.base}/mail`;
    return this.http.get<PindustExpedienteJustificacionDto>(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * POST /mail/send-justification
   * body: { idAdv: number|string, tipo?: string }
   *
   * Si destMail está presente, llama a:
   * POST /mail/send-justification/:destMail
   */
  sendJustification(body: { idAdv: number | string; tipo?: string }, destMail?: string): Observable<PindustExpedienteJustificacionDto> {
    const endpoint = destMail
      ? `${this.base}/mail/send-justification/${encodeURIComponent(destMail)}`
      : `${this.base}/mail/send-justification`;

    return this.http.post<PindustExpedienteJustificacionDto>(endpoint, JSON.stringify(body), { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  sendILSRenovationMail(expediente: any): Observable<any> {
    const URL_API_SEND = 'https://tramits.idi.es/public/assets/utils/enviaCorreoElectronicoRenovacionMarcaNew.php';
    const params = new HttpParams()
      .set('id', expediente.id)
      .set('subject', "Formulari per a la renovació de la marca ILS - ADRBalears")
    return this.http.get<any>(URL_API_SEND, { params });
  }

  sendJustificationMail(idExp: number): Observable<any> {
    const URL_API_SEND = 'https://tramits.idi.es/public/assets/utils/enviaCorreoElectronicoJustificacionNew.php';
    const params = new HttpParams()
      .set('id', idExp)
      .set('subject', "Formulari per a la justificació de XECS - ADRBalears")
    return this.http.get<any>(URL_API_SEND, { params });
  }

  /**
   * Handler de errores HTTP
   */
  private handleError(error: HttpErrorResponse) {
    // Puedes ampliar lógica para token refresh, logging, Sentry, etc.
    let msg = 'Error desconocido';
    if (error.error instanceof ErrorEvent) {
      // Error del cliente / red
      msg = `Error de red: ${error.error.message}`;
    } else {
      // Backend returned an unsuccessful response code.
      msg = `Error servidor ${error.status}: ${error.message || JSON.stringify(error.error)}`;
    }
    // Lanza observable con mensaje legible
    return throwError(() => ({ status: error.status, message: msg, raw: error }));
  }
}
