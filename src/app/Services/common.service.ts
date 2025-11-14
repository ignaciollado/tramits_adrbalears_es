import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { ZipCodesIBDTO } from '../Models/zip-codes-ib.dto';
import { CnaeDTO } from '../Models/cnae.dto';
import { XecsProgramsDTO } from '../Models/xecs-programs-dto';
import { AuthorizationTextDTO } from '../Models/authorization-texts-dto';
import jsPDF from 'jspdf';
import { ResponsabilityDeclarationDTO } from '../Models/responsability-declaration-dto';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CommonService {

  private ibrelleuAPI: string
  private apiUrl = environment.apiUrl
  private urlAPIMock: string


  constructor(private http: HttpClient, private snackBar: MatSnackBar) {
    this.urlAPIMock = '../../assets/data/';
    this.ibrelleuAPI = "https://data.ibrelleu.es/public/index.php"

  }

  // Documentos y autorizaciones XECS
  getDocumentationAndAuthorizations(): Observable<AuthorizationTextDTO[]> {
    return this.http.get<AuthorizationTextDTO[]>(`${this.urlAPIMock}authorizationTexts.json`).pipe(catchError(this.handleError))
  }

  // Programas linea XECS
  getXecsPrograms(): Observable<XecsProgramsDTO[]> {
    return this.http.get<XecsProgramsDTO[]>(`${this.urlAPIMock}xecsPrograms.json`).pipe(catchError(this.handleError))
  }

  // Responsability Declarations XECS
  getResponsabilityDeclarations(): Observable<ResponsabilityDeclarationDTO[]> {
    return this.http.get<ResponsabilityDeclarationDTO[]>(`${this.urlAPIMock}responsabilityDeclarations.json`).pipe(catchError(this.handleError))
  }

  /* CRUD Zipcodes */

  // GET all
  getZipCodes(): Observable<ZipCodesIBDTO[]> {
    return this.http.get<ZipCodesIBDTO[]>(`${this.ibrelleuAPI}/zipcodes`).pipe(catchError(this.handleError))
  }

  // GET by ID
  getOneZipCode(id: number): Observable<ZipCodesIBDTO> {
    return this.http.get<ZipCodesIBDTO>(`${this.ibrelleuAPI}/zipcodes/${id}`).pipe(catchError(this.handleError))
  }

  // POST
  createZipCode(zipCode: ZipCodesIBDTO): Observable<ZipCodesIBDTO> {
    return this.http.post<ZipCodesIBDTO>(`${this.ibrelleuAPI}/zipcodes/create`, zipCode).pipe(catchError(this.handleError))
  }

  // PUT
  updateZipCode(id: number, zipCode: ZipCodesIBDTO): Observable<ZipCodesIBDTO> {
    return this.http.put<ZipCodesIBDTO>(`${this.ibrelleuAPI}/zipcodes/update/${id}`, zipCode).pipe(catchError(this.handleError))
  }

  // DELETE
  deleteZipCode(id: number): Observable<void> {
    return this.http.delete<void>(`${this.ibrelleuAPI}/zipcodes/delete/${id}`).pipe(catchError(this.handleError))
  }

  /* CRUD Cnaes */
  getCNAEs(): Observable<CnaeDTO[]> {
    return this.http.get<CnaeDTO[]>(`${this.apiUrl}/pindustactividades`).pipe(catchError(this.handleError))
  }

  getOneCNAE(id: number): Observable<CnaeDTO> {
    return this.http.get<CnaeDTO>(`${this.apiUrl}/pindustactividades/${id}`).pipe(catchError(this.handleError))
  }

  createCNAE(zipCode: CnaeDTO): Observable<CnaeDTO> {
    return this.http.post<CnaeDTO>(`${this.apiUrl}/pindustactividades`, zipCode).pipe(catchError(this.handleError))
  }

  updateCNAE(id: number, zipCode: CnaeDTO): Observable<CnaeDTO> {
    return this.http.put<CnaeDTO>(`${this.apiUrl}/pindustactividades/${id}`, zipCode).pipe(catchError(this.handleError))
  }

  deleteCNAE(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/pindustactividades/${id}`).pipe(catchError(this.handleError))
  }

  /* GET JSON situación */
  getSituations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlAPIMock}expedientSituations.json`).pipe(catchError(this.handleError));
  }

  /* GET JSON situación ILS */
  getIlsSituations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlAPIMock}ilsSituations.json`).pipe(catchError(this.handleError));
  }

  /* Generate timeStamp */

  generateCustomTimestamp(): string {
    const date = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;
    return `${pad(date.getDate())}_${pad(date.getMonth() + 1)}_${date.getFullYear()}_${pad(hours)}_${pad(date.getMinutes())}_${pad(date.getSeconds())}${ampm}`;
  }

  getCurrentDateTime(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  convertUnixToHumanDate(unixDate: number, shortMode:boolean): string {
    const fecha = new Date(unixDate); // convertir a Date
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0'); // Enero = 0
    const anio = fecha.getFullYear();
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    const segundos = String(fecha.getSeconds()).padStart(2, '0');
    if (shortMode) {
      return `${anio}-${mes}-${dia}`;
    }
    return `${dia}/${mes}/${anio} ${horas}:${minutos}:${segundos}`;
  }

/**
 * Calcula la cantidad de días laborables entre hoy y la fecha dada+10 días.
 * Devuelve un número positivo si la fecha es futura, negativo si es pasada.
 */
  calculateDueDate(fechaInicial: string | Date, dias: number): string {
  // Convertimos a Date si es un string
  const fecha = typeof fechaInicial === 'string' ? new Date(fechaInicial) : new Date(fechaInicial.getTime());
  let diasHabiles = 0;

  while (diasHabiles < dias) {
    // Avanzamos un día
    fecha.setDate(fecha.getDate() + 1);

    const diaSemana = fecha.getDay(); // 0 = domingo, 6 = sábado
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasHabiles++;
    }
  }

  // Formateamos la fecha a 'YYYY-MM-DD'
  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
  }

  /**
 * Calcula los días de diferencia entre la fecha actual y una fecha dada.
 * Si la fecha ya pasó, devuelve un número negativo.
 * 
 * @param dueDate Fecha de vencimiento (string o Date)
 * @returns Número de días restantes
 */
calculateRestingDays(dueDate: string | Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalizamos a medianoche

  const targetDate = typeof dueDate === 'string' ? new Date(dueDate) : new Date(dueDate);
  targetDate.setHours(0, 0, 0, 0); // Normalizamos a medianoche

  const diffMs = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)); // Convertimos ms a días
  return diffDays;
}


  showSnackBar(error: string): void {
    this.snackBar.open(error, 'Close', {
      duration: 5000,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
      panelClass: ['custom-snackbar'],
    });
  }

  generatePDFDocument(dataToRender: any): void {
    const doc = new jsPDF();

    // Texto del pie de página
    const footerText = 'Plaça de Son Castelló, 1\n07009 Polígon de Son Castelló - Palma\nTel. 971 17 61 61\nwww.adrbalears.es';

    // Establecer estilo si lo deseas
    doc.setFont('Arial', 'normal');
    doc.setFontSize(8);

    // Posición del pie de página
    const marginLeft = 25;
    const lineHeight = 4;
    const pageHeight = doc.internal.pageSize.getHeight();

    // Dividir el texto en líneas
    const lines = footerText.split('\n');

    // Dibujar cada línea desde abajo hacia arriba
    lines.reverse().forEach((line, index) => {
      const y = pageHeight - 10 - (index * lineHeight);
      doc.text(line, marginLeft, y);
    });

    // Añadir el texto centrado en la parte inferior
    //const textWidth = doc.getTextWidth(footerText);
    //const pageWidth = doc.internal.pageSize.getWidth();
    //const x = (pageWidth - textWidth) / 2;
    // const y = pageHeight - margin;
    //doc.text(footerText, x, y);

    const rawDate = dataToRender.eventDate; // puede ser string o Date
    const eventDate = new Date(rawDate);

    const TITULO_EVENTO = dataToRender.title
    const FECHA_EVENTO = `${eventDate.getDate().toString().padStart(2, '0')}/${(eventDate.getMonth() + 1).toString().padStart(2, '0')}/${eventDate.getFullYear()}`;
    const HORAS_EVENTO = dataToRender.timeDuration + " hrs"

    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('ca-ES', options);

    doc.addImage("../../../../assets/images/ADRBalearscompleto-conselleria.jpg", "JPEG", 25, 20, 75, 15);
    doc.setFontSize(12);
    doc.text("Convocatoria para la concesión de ayudas de cheques de consultoría para impulsar a la industria de Baleares en materia de digitalización, internacionalización, sostenibilidad y gestión avanzada.,", 25, 65)

    doc.setFont('Arial', 'bold');
    doc.text("CERTIFIC:", 25, 100)
    doc.setFont('Arial', 'normal');

    doc.text(`Convocatoria 2025 ${dataToRender.firstName + ' ' + dataToRender.lastName} , amb DNI ${dataToRender.dni}, ha assistit a la càpsula\nformativa “${TITULO_EVENTO}”, organitzat per l'Agència de\nDesevolupament Regional de les Illes Balears (ADR). Dia ${FECHA_EVENTO},\namb una durada de ${HORAS_EVENTO}`, 25, 140)

    doc.text("I perquè consti als efectes oportuns firm aquest certificat.", 25, 180)

    doc.text(`Palma, ${formattedDate}`, 25, 220);

    doc.save(`certificado_${dataToRender.firstName + '_' + dataToRender.lastName}.pdf`);
  }

  formatDate(fecha: string | Date): string {
    // Convertir string a Date si es necesario
    const dateObj = (typeof fecha === 'string') ? new Date(fecha) : fecha;

    const pad = (n: number) => n < 10 ? '0' + n : n;

    const dia = pad(dateObj.getDate());
    const mes = pad(dateObj.getMonth() + 1);
    const anio = dateObj.getFullYear();

    const horas = pad(dateObj.getHours());
    const minutos = pad(dateObj.getMinutes());

    return `${dia}/${mes}/${anio} ${horas}:${minutos}`;
  }

  formatCurrency(importe: number | string): string {
    if (!importe) { return '0.00' }
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(importe));
  }

  cleanRawText(rawText: any): any {
    if (typeof rawText === 'string') {
      // Reemplazar saltos de línea, tabulaciones y otros caracteres de control
      return rawText.replace(/[\r\n\t]+/g, ' ').trim(); // Reemplaza saltos de línea y tabulaciones por espacios
    } else if (Array.isArray(rawText)) {
      // Si es un array, aplicar la limpieza a cada elemento
      return rawText.map(item => this.cleanRawText(item));
    } else if (typeof rawText === 'object' && rawText !== null) {
      // Si es un objeto, limpiar cada valor de sus propiedades
      for (const key in rawText) {
        if (rawText.hasOwnProperty(key)) {
          rawText[key] = this.cleanRawText(rawText[key]);
        }
      }
    }
    return rawText;
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Unknown error!';
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(errorMessage);
  }
}