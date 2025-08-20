import { CommonModule, formatDate } from '@angular/common';
import { Component, inject, Input, SimpleChange } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import jsPDF from 'jspdf';
import { finalize } from 'rxjs';
import { ActoAdministrativoDTO } from '../../Models/acto-administrativo-dto';
import { DocSignedDTO } from '../../Models/docsigned.dto';
import { DocumentoGeneradoDTO } from '../../Models/documentos-generados-dto';
import { CreateSignatureRequest, SignatureResponse } from '../../Models/signature.dto';
import { ActoAdministrativoService } from '../../Services/acto-administrativo.service';
import { CommonService } from '../../Services/common.service';
import { DocumentosGeneradosService } from '../../Services/documentos-generados.service';
import { ExpedienteService } from '../../Services/expediente.service';
import { ViafirmaService } from '../../Services/viafirma.service';

@Component({
  selector: 'app-informe-favorable-adr-isba',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, MatExpansionModule, MatButtonModule],
  templateUrl: './informe-favorable.component.html',
  styleUrl: './informe-favorable.component.scss'
})
export class InformeFavorableAdrIsbaComponent {
  private expedienteService = inject(ExpedienteService);
  actoAdmin3: boolean = false;
  sendedToSign: boolean = false;
  signatureDocState: string = "";
  nifDocGenerado: string = "";
  timeStampDocGenerado: string = "";
  userLoginEmail: string = "";
  ceoEmail: string = "jldejesus@adrbalears.caib.es"; // Temporal
  pdfUrl: SafeResourceUrl | null = null;
  imageUrl: SafeUrl | undefined;
  showPdfViewer: boolean = false;
  showImageViewer: boolean = false;
  nameDocGenerado: string = "";
  loading: boolean = false;
  response?: SignatureResponse;
  error?: string;
  codigoSIAConvo: string = "3153714";


  docGeneradoInsert: DocumentoGeneradoDTO = {
    id_sol: 0,
    cifnif_propietario: '',
    convocatoria: '',
    name: '',
    type: '',
    created_at: '',
    tipo_tramite: '',
    corresponde_documento: '',
    selloDeTiempo: '',
    publicAccessId: ''
  }

  lastInsertId: number | undefined;
  publicAccessId: string = "";
  externalSignUrl: string = "";
  sendedUserToSign: string = "";
  sendedDateToSign!: Date;
  faltanCampos: boolean = false;
  camposVacios: string[] = [];
  formattedFecha_REC!: string;
  signedBy!: string;

  @Input() actualID!: number;
  @Input() actualIdExp!: number;
  @Input() actualNif: string = "";
  @Input() actualConvocatoria!: number;
  @Input() actualTipoTramite!: string;
  @Input() actualEmpresa: string = "";

  /* Campos de formularios */
  // Campos obligatorios para generar Acto
  @Input() fecha_REC!: string;
  @Input() ref_REC!: string;

  // Campos que aparecen en la template del Acto
  @Input() importe_ayuda!: number; // Importe ayuda
  @Input() intereses_ayuda!: number; // Intereses
  @Input() costes_aval!: number; // Costes aval
  @Input() gastos_aval!: number; // Costes apertura
  constructor(
    private commonService: CommonService, private sanitizer: DomSanitizer,
    private viafirmaService: ViafirmaService,
    private documentosGeneradosService: DocumentosGeneradosService,
    private actoAdminService: ActoAdministrativoService
  ) {
    this.userLoginEmail = sessionStorage.getItem('tramits_user_email') || '';
  }

  get stateClassActAdmin3(): string {
    const map: Record<string, string> = {
      NOT_STARTED: 'req-state--not-started',
      IN_PROCESS: 'req-state--in-process',
      COMPLETED: 'req-state--completed',
      REJECTED: 'req-state--rejected',
    };

    return map[this.signatureDocState ?? ''] ?? 'req-state--not-started';
  }

  ngOnInit(): void {
    this.actoAdminService.getByNameAndTipoTramite('isba_3_informe_favorable_sin_requerimiento', 'ADR-ISBA').subscribe((docDataString: ActoAdministrativoDTO) => {
      this.signedBy = docDataString.signedBy;
    }).unsubscribe;
  }

  ngOnChanges(changes: SimpleChange): void {
    if (this.tieneTodosLosValores()) {
      this.getActoAdminDetail();
    }
  }

  private tieneTodosLosValores(): boolean {
    return (
      this.actualID != null &&
      this.actualIdExp != null &&
      !!this.actualNif &&
      this.actualConvocatoria != null &&
      !!this.actualTipoTramite &&
      !!this.importe_ayuda &&
      !!this.intereses_ayuda &&
      !!this.costes_aval &&
      !!this.gastos_aval
    )
  }

  getActoAdminDetail(): void {
    this.documentosGeneradosService.getDocumentosGenerados(this.actualID, this.actualNif, this.actualConvocatoria, 'doc_informe_favorable_sin_requerimiento')
      .subscribe({
        next: (docActoAdmin3: DocumentoGeneradoDTO[]) => {
          this.actoAdmin3 = false;
          if (docActoAdmin3.length === 1) {
            this.actoAdmin3 = true;
            this.nifDocGenerado = docActoAdmin3[0].cifnif_propietario;
            this.timeStampDocGenerado = docActoAdmin3[0].selloDeTiempo;
            this.nameDocGenerado = docActoAdmin3[0].name;
            this.lastInsertId = docActoAdmin3[0].id;
            this.publicAccessId = docActoAdmin3[0].publicAccessId;

            if (this.publicAccessId) {
              this.getSignState(this.publicAccessId);
            }
          }
        },
        error: (err) => {
          console.error('Error obteniendo documentos', err);
          this.actoAdmin3 = false;
        }
      })
  }

  generateActoAdmin(actoAdministrativoName: string, tipo_tramite: string, docFieldToUpdate: string): void {
    this.tieneTodosLosCamposRequeridos();
    if (this.faltanCampos) {
      return;
    }

    const timeStamp = this.commonService.generateCustomTimestamp();
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      floatPrecision: 16
    });

    doc.setProperties({
      title: `${this.actualIdExp}_${this.actualConvocatoria}_${docFieldToUpdate}`,
      subject: 'Tràmits administratius',
      author: 'ADR Balears',
      keywords: 'ayudas, subvenciones, xecs, ils, adr-isba',
      creator: 'Angular App'
    });

    const footerText = 'Plaça de Son Castelló, 1\n07009 Polígon de Son Castelló - Palma\nTel. 971 17 61 61\nwww.adrbalears.es';
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    const marginLeft = 25;
    const lineHeight = 4;
    const pageHeight = doc.internal.pageSize.getHeight();
    const lines = footerText.split('\n');

    lines.reverse().forEach((line, index) => {
      const y = pageHeight - 10 - (index * lineHeight);
      doc.text(line, marginLeft, y)
    });

    this.actoAdminService.getByNameAndTipoTramite(actoAdministrativoName, tipo_tramite)
      .subscribe((docDataString: ActoAdministrativoDTO) => {
        let rawTexto = docDataString.texto;
        this.signedBy = docDataString.signedBy;

        if (!rawTexto) {
          this.commonService.showSnackBar('❌ No se encontró el texto del acto administrativo.');
          return;
        }
        /* Formateo la fecha de solicitud antes de reemplazar en el texto */
        this.formattedFecha_REC = formatDate(this.fecha_REC, 'dd/MM/yyyy HH:mm:ss', 'es-ES');

        rawTexto = rawTexto.replace(/%SOLICITANTE%/g, this.actualEmpresa);
        rawTexto = rawTexto.replace(/%NIF%/g, this.actualNif);
        rawTexto = rawTexto.replace(/%FECHASOLICITUD%/g, this.formattedFecha_REC);
        rawTexto = rawTexto.replace(/%IMPORTEAYUDA%/g, `${this.importe_ayuda}€`);
        rawTexto = rawTexto.replace(/%IMPORTE_INTERESES%/g, `${this.intereses_ayuda}€`);
        rawTexto = rawTexto.replace(/%IMPORTE_AVAL%/g, `${this.costes_aval}€`);
        rawTexto = rawTexto.replace(/%IMPORTE_APERTURA%/g, `${this.gastos_aval}€`);
        /* Queda pendiente: BOIBNUM */

        const jsonObject = JSON.parse(rawTexto);

        const maxCharsPerLine = 21;
        const marginLeft = 25;
        const maxTextWidth = 160;
        const x = marginLeft + 110;
        const y = 51;
        const hechos: string[] = jsonObject.hechos_1_2_3_4_5.split('\n\n');
        let hechos_y = 110;
        const paragraphSpacing = 4;



        doc.setFont('helvetica', 'bold');
        doc.addImage("../../../assets/images/logo-adrbalears-ceae-byn.png", "PNG", 25, 20, 75, 15);
        doc.setFontSize(8);
        doc.text("Document: informe favorable", x, 45);
        doc.text(`Núm. Expedient: ${this.actualIdExp}/${this.actualConvocatoria}`, x, 48);
        if (this.actualEmpresa.length > maxCharsPerLine) {
          const firstLine = this.actualEmpresa.slice(0, maxCharsPerLine);
          const secondLine = this.actualEmpresa.slice(maxCharsPerLine);
          doc.text(`Nom sol·licitant: ${firstLine}`, x, y);
          doc.text(secondLine, x, y + 3);
          doc.text(`NIF: ${this.actualNif}`, x, y + 6);
          doc.text("Emissor (DIR3): A04003714", x, y + 9);
          doc.text(`Codi SIA: ${this.codigoSIAConvo}`, x, y + 12);
        } else {
          doc.text(`Nom sol·licitant: ${this.actualEmpresa}`, x, y);
          doc.text(`NIF: ${this.actualNif}`, x, 54);
          doc.text("Emissor (DIR3): A04003714", x, 57);
          doc.text(`Codi SIA: ${this.codigoSIAConvo}`, x, 60);
        }

        doc.setFontSize(10);
        doc.text(doc.splitTextToSize(jsonObject.intro, maxTextWidth), marginLeft, 80);
        doc.text(doc.splitTextToSize(jsonObject.hechos_tit, maxTextWidth), marginLeft, 100);
        doc.setFont('helvetica', 'normal');

        // Itero debido a que hay una cadena que no es un hecho, sino información sobre el acto administrativo
        hechos.forEach((hecho, index) => {
          const lines = doc.splitTextToSize(hecho, maxTextWidth);
          const x = index === hechos.length - 1 ? marginLeft : marginLeft + 5;
          doc.text(lines, x, hechos_y);
          hechos_y += lines.length * lineHeight + paragraphSpacing;
        });

        doc.setFont('helvetica', 'bold');
        doc.text(doc.splitTextToSize(jsonObject.conclusion_tit, maxTextWidth), marginLeft, 204)
        doc.setFont('helvetica', 'normal');
        doc.text(doc.splitTextToSize(jsonObject.conclusioTxt, maxTextWidth), marginLeft, 214)
        doc.text(doc.splitTextToSize(jsonObject.firma, maxTextWidth), marginLeft, 250);

        // Convertir a Blob
        const pdfBlob = doc.output('blob');

        // Crear formData
        const formData = new FormData();
        const fileName = `${this.actualIdExp}_${this.actualConvocatoria}_${docFieldToUpdate}.pdf`;
        formData.append('file', pdfBlob, fileName);
        formData.append('id_sol', String(this.actualID));
        formData.append('convocatoria', String(this.actualConvocatoria));
        formData.append('nifcif_propietario', String(this.actualNif));
        formData.append('timeStamp', String(timeStamp));

        this.actoAdminService.sendPDFToBackEnd(formData).subscribe({
          next: (response) => {
            this.docGeneradoInsert.id_sol = this.actualID;
            this.docGeneradoInsert.cifnif_propietario = this.actualNif;
            this.docGeneradoInsert.convocatoria = String(this.actualConvocatoria);
            this.docGeneradoInsert.name = `doc_${docFieldToUpdate}.pdf`;
            this.docGeneradoInsert.type = 'application/pdf';
            this.docGeneradoInsert.created_at = response.path;
            this.docGeneradoInsert.tipo_tramite = this.actualTipoTramite;
            this.docGeneradoInsert.corresponde_documento = `doc_${docFieldToUpdate}`;
            this.docGeneradoInsert.selloDeTiempo = timeStamp;

            this.nameDocGenerado = `doc_${docFieldToUpdate}.pdf`;

            // Delete documentos previamente generados para evitar duplicados
            this.documentosGeneradosService.deleteByIdSolNifConvoTipoDoc(this.actualID, this.actualNif, this.actualConvocatoria, 'doc_informe_favorable_sin_requerimiento')
              .subscribe({
                next: () => {
                  this.insertDocumentoGenerado(docFieldToUpdate);
                },
                error: (deleteErr) => {
                  const status = deleteErr?.status;
                  const msg = deleteErr?.error?.message || '';
                  // Si es "no encontrado" (por ejemplo, 404) seguimos el flujo normal
                  if (status === 404 || msg.includes('no se encontró') || msg.includes('No existe')) {
                    this.commonService.showSnackBar('ℹ️ No había documento previo que eliminar.');
                    this.insertDocumentoGenerado(docFieldToUpdate);
                  } else {
                    // Otros errores sí se notifican y no continúan
                    const deleteErrMsg = msg || '❌ Error al eliminar el documento previo.';
                    this.commonService.showSnackBar(deleteErrMsg);
                  }
                }
              });
          }
        });
      });
  }

  /**
   * Método que comprueba los campos requeridos antes de realizar la generación del acto administrativo
  */
  private tieneTodosLosCamposRequeridos(): void {
    this.camposVacios = [];
    this.faltanCampos = false;

    if (!this.fecha_REC?.trim() || this.fecha_REC?.trim() === "0000-00-00 00:00:00") {
      this.camposVacios.push('FORM.FECHA_REC')
    }

    if (!this.ref_REC?.trim()) {
      this.camposVacios.push('FORM.REF_REC')
    }

    this.faltanCampos = this.camposVacios.length > 0;
  }

  insertDocumentoGenerado(docFieldToUpdate: string): void {
    this.documentosGeneradosService.create(this.docGeneradoInsert).subscribe({
      next: (resp: any) => {
        this.lastInsertId = resp?.id;
        if (this.lastInsertId) {
          this.expedienteService
            .updateDocFieldExpediente(this.actualID, `doc_${docFieldToUpdate}`, String(this.lastInsertId))
            .subscribe({
              next: (response: any) => {
                const mensaje =
                  response?.message || '✅ Acto administrativo generado y expediente actualizado correctamente.';

                this.actoAdmin3 = true;
                this.commonService.showSnackBar(mensaje);
              },
              error: (updateErr) => {
                const updateErrorMsg =
                  updateErr?.error?.message ||
                  '⚠️ Documento generado, pero error al actualizar el expediente.';
                this.commonService.showSnackBar(updateErrorMsg);
              }
            });
        } else {
          this.commonService.showSnackBar(
            '⚠️ Documento generado, pero no se recibió el ID para actualizar el expediente.'
          );
        }
      },
      error: (insertErr) => {
        const insertErrorMsg =
          insertErr?.error?.message ||
          '❌ Error al guardar el documento generado.';
        this.commonService.showSnackBar(insertErrorMsg);
      }
    });
  }

  viewActoAdmin(nif: string, folder: string, filename: string, extension: string): void {
    const entorno = sessionStorage.getItem('entorno');
    filename = filename.replace(/^doc_/, "");
    filename = `${this.actualIdExp}_${this.actualConvocatoria}_${filename}`;
    let url = "";
    url = entorno === "tramits" ?
      `https://tramits.idi.es/public/index.php/documents/view/${nif}/${folder}/${filename}` :
      `https://pre-tramits.idi.es/public/index.php/documents/view/${nif}/${folder}/${filename}`;

    const sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);

    const ext = extension.toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg') {
      this.imageUrl = sanitizedUrl;
      this.pdfUrl = null;
      this.showImageViewer = true;
      this.showPdfViewer = false;
    } else {
      this.pdfUrl = sanitizedUrl;
      this.imageUrl = undefined;
      this.showPdfViewer = true;
      this.showImageViewer = false;
    }
  }

  closeViewActoAdmin(): void {
    this.showPdfViewer = false;
    this.pdfUrl = null;
  }

  sendActoAdminToSign(nif: string, folder: string, filename: string, extension: string): void {
    // Limpieza estados previos
    this.error = undefined;
    this.response = undefined;
    this.loading = true;
    filename = filename.replace(/^doc_/, "");
    filename = `${this.actualIdExp}_${this.actualConvocatoria}_${filename}`;

    const payload: CreateSignatureRequest = {
      adreca_mail: this.signedBy === 'technician' ? this.userLoginEmail : this.ceoEmail,
      nombreDocumento: filename,
      nif: nif,
      last_insert_id: this.lastInsertId
    };

    this.viafirmaService.createSignatureRequest(payload)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (res) => {
          this.response = res;
          const id = res?.publicAccessId;
          this.publicAccessId = id ?? '';
          this.commonService.showSnackBar(id ? `Solicitud de firma creada. ID: ${id} y enviada a la dirección: ${payload.adreca_mail}` : 'Solicitud de firma creada correctamente');
          this.getSignState(this.publicAccessId);
        },
        error: (err) => {
          const msg = err?.error?.message || err?.message || 'No se pudo enviar la solicitud de firma';
          this.error = msg;
          this.commonService.showSnackBar(msg);
        }
      });
  }

  getSignState(publicAccessId: string): void {
    this.viafirmaService.getDocumentStatus(publicAccessId)
      .subscribe((resp: DocSignedDTO) => {
        this.signatureDocState = resp.status;
        this.externalSignUrl = resp.addresseeLines[0].addresseeGroups[0].userEntities[0].externalSignUrl;
        this.sendedUserToSign = resp.addresseeLines[0].addresseeGroups[0].userEntities[0].userCode;
        const sendedDateToSign = resp.creationDate;
        this.sendedDateToSign = new Date(sendedDateToSign);
      })
  }
}
