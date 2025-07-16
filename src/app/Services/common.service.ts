import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { ZipCodesIBDTO } from '../Models/zip-codes-ib.dto';
import { CnaeDTO } from '../Models/cnae.dto';
import { XecsProgramsDTO } from '../Models/xecs-programs-dto';
import { AuthorizationTextDTO } from '../Models/authorization-texts-dto';
import jsPDF from 'jspdf';
import { ResponsabilityDeclarationDTO } from '../Models/responsability-declaration-dto';

@Injectable({
  providedIn: 'root',
})
export class CommonService {

  private urlAPI: string
  private urlAPITramits: string
  private urlAPIMock: string


  constructor(private http: HttpClient) {
    this.urlAPIMock = '../../assets/data/';

    this.urlAPI = "https://data.ibrelleu.es/public/index.php"
    this.urlAPITramits = "https://pre-tramits.idi.es/public/index.php"
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
    return this.http.get<ZipCodesIBDTO[]>(`${this.urlAPI}/zipcodes`).pipe(catchError(this.handleError))
  }

  // GET by ID
  getOneZipCode(id: number): Observable<ZipCodesIBDTO> {
    return this.http.get<ZipCodesIBDTO>(`${this.urlAPI}/zipcodes/${id}`).pipe(catchError(this.handleError))
  }

  // POST
  createZipCode(zipCode: ZipCodesIBDTO): Observable<ZipCodesIBDTO> {
    return this.http.post<ZipCodesIBDTO>(`${this.urlAPI}/zipcodes/create`, zipCode).pipe(catchError(this.handleError))
  }

  // PUT
  updateZipCode(id: number, zipCode: ZipCodesIBDTO): Observable<ZipCodesIBDTO> {
    return this.http.put<ZipCodesIBDTO>(`${this.urlAPI}/zipcodes/update/${id}`, zipCode).pipe(catchError(this.handleError))
  }

  // DELETE
  deleteZipCode(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlAPI}/zipcodes/delete/${id}`).pipe(catchError(this.handleError))
  }

   /* CRUD Cnaes */
  getCNAEs(): Observable<CnaeDTO[]> {
    return this.http.get<CnaeDTO[]>(`${this.urlAPITramits}/pindustactividades`).pipe(catchError(this.handleError))
  }

  getOneCNAE(id: number): Observable<CnaeDTO> {
    return this.http.get<CnaeDTO>(`${this.urlAPITramits}/pindustactividades/${id}`).pipe(catchError(this.handleError))
  }

  createCNAE(zipCode: CnaeDTO): Observable<CnaeDTO> {
    return this.http.post<CnaeDTO>(`${this.urlAPITramits}/pindustactividades`, zipCode).pipe(catchError(this.handleError))
  }

  updateCNAE(id: number, zipCode: CnaeDTO): Observable<CnaeDTO> {
    return this.http.put<CnaeDTO>(`${this.urlAPITramits}/pindustactividades/${id}`, zipCode).pipe(catchError(this.handleError))
  }

  deleteCNAE(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlAPITramits}/pindustactividades/${id}`).pipe(catchError(this.handleError))
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
  
    doc.text(`Convocatoria 2025 ${dataToRender.firstName+' '+dataToRender.lastName} , amb DNI ${dataToRender.dni}, ha assistit a la càpsula\nformativa “${TITULO_EVENTO}”, organitzat per l'Agència de\nDesevolupament Regional de les Illes Balears (ADR). Dia ${FECHA_EVENTO},\namb una durada de ${HORAS_EVENTO}`, 25, 140)
  
    doc.text("I perquè consti als efectes oportuns firm aquest certificat.", 25, 180)
  
    doc.text(`Palma, ${formattedDate}`, 25, 220);
  
    doc.save(`certificado_${dataToRender.firstName+'_'+dataToRender.lastName}.pdf`);
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