import { CommonModule, formatDate } from '@angular/common';
import { Component, inject, Input, SimpleChanges } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { ActoAdministrativoDTO } from '../../Models/acto-administrativo-dto';
import { ConfigurationModelDTO } from '../../Models/configuration.dto';
import { DocSignedDTO } from '../../Models/docsigned.dto';
import { DocumentoGeneradoDTO } from '../../Models/documentos-generados-dto';
import { PindustLineaAyudaDTO } from '../../Models/linea-ayuda-dto';
import { SignatureResponse, CreateSignatureRequest } from '../../Models/signature.dto';
import { ActoAdministrativoService } from '../../Services/acto-administrativo.service';
import { CommonService } from '../../Services/common.service';
import { DocumentosGeneradosService } from '../../Services/documentos-generados.service';
import { ExpedienteService } from '../../Services/expediente.service';
import { PindustLineaAyudaService } from '../../Services/linea-ayuda.service';
import { PindustConfiguracionService } from '../../Services/pindust-configuracion.service';
import { ViafirmaService } from '../../Services/viafirma.service';
import jsPDF from 'jspdf';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-res-renovacion-marca-ils',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatButtonModule, MatExpansionModule],
  templateUrl: './res-renovacion-marca.component.html',
  styleUrl: './res-renovacion-marca.component.scss'
})
export class ResRenovacionMarcaIlsComponent {
  private expedienteService = inject(ExpedienteService);
  actoAdmin: boolean = false;
  sendedToSign: boolean = false;
  signatureDocState: string = "";
  nifDocGenerado: string = "";
  timeStampDocGenerado: string = "";
  nameDocGenerado: string = "";
  pdfUrl: SafeResourceUrl | null = null;
  showPdfViewer: boolean = false;
  loading: boolean = false;
  response?: SignatureResponse;
  error?: string;
  lineDetail: PindustLineaAyudaDTO[] = [];
  codigoSIA: string = "";

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
  signedBy!: string;

  nomPresidenteIdi!: string;

  docDataString!: ActoAdministrativoDTO;

  technicianEmail!: string;
  ceoEmail!: string;
  consellerEmail!: string;

  @Input() actualID!: number;
  @Input() actualIdExp!: number;
  @Input() actualNif: string = "";
  @Input() actualConvocatoria!: number
  @Input() actualTipoTramite!: string;
  @Input() actualEmpresa: string = "";
  @Input() form!: FormGroup;

  constructor(
    private commonService: CommonService, private sanitizer: DomSanitizer,
    private viafirmaService: ViafirmaService,
    private documentosGeneradosService: DocumentosGeneradosService,
    private actoAdminService: ActoAdministrativoService,
    private lineaAyuda: PindustLineaAyudaService,
    private configGlobal: PindustConfiguracionService
  ) {
    this.technicianEmail = sessionStorage.getItem('tramits_user_email') || '';
  }

  get stateClass(): string {
    const map: Record<string, string> = {
      NOT_STARTED: 'req-state--not-started',
      IN_PROCESS: 'req-state--in-process',
      COMPLETED: 'req-state--completed',
      REJECTED: 'req-state--rejected',
    };
    return map[this.signatureDocState ?? ''] ?? 'req-state--not-started';
  }

  ngOnInit(): void {
    this.actoAdminService.getByNameAndTipoTramite('ILS_13_renovacion_resolucion_renov_sin_requerimiento', 'ILS')
      .subscribe((docDataString: ActoAdministrativoDTO) => {
        this.docDataString = docDataString;
        this.signedBy = docDataString.signedBy;
      })
  }

  ngOnChanges(): void {
    if (this.tieneTodosLosValores()) {
      this.getActoAdminDetail();
      this.getLineDetail(this.actualConvocatoria);
      this.getGlobalConfig();
    }
  }

  private tieneTodosLosValores(): boolean {
    return (
      this.actualID != null &&
      this.actualIdExp != null &&
      !!this.actualNif &&
      this.actualConvocatoria != null &&
      !!this.actualTipoTramite
    );
  }

  generateActoAdmin(docFieldToUpdate: string): void {
    this.tieneTodosLosCamposRequeridos();
    if (this.faltanCampos) { return; }

    const timeStamp = this.commonService.generateCustomTimestamp()
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
    const maxCharsPerLine = 21;
    const maxTextWidth = 160;
    const x = marginLeft + 110;
    const y = 51;
    const lineHeight = 4;
    const pageHeight = doc.internal.pageSize.getHeight();
    const lines = footerText.split('\n');
    const pageWidth = doc.internal.pageSize.getWidth();

    lines.reverse().forEach((line, index) => {
      const y = pageHeight - 10 - (index * lineHeight);
      doc.text(line, marginLeft, y);
    });

    let rawTexto = this.docDataString.texto;
    this.signedBy = this.docDataString.signedBy;

    if (!rawTexto) {
      this.commonService.showSnackBar('❌ No se encontró el texto del acto administrativo.');
      return;
    }

    /* Fechas formateadas */
    const formattedFecha_resolucion = formatDate(this.form.get('fecha_resolucion')?.value, 'dd/MM/yyyy', 'es-ES');
    const formattedFecha_REC_justificacion_renov = formatDate(this.form.get('fecha_REC_justificacion_renov')?.value, 'dd/MM/yyyy HH:mm', 'es-ES');
    const formattedFecha_infor_fav_renov = formatDate(this.form.get('fecha_infor_fav_renov')?.value, 'dd/MM/yyyy', 'es-ES');

    /* Suma de 2 años para HASTAFECHANOTRESRENOVACION */
    const hastaFechaNotResRenovacion = new Date(this.form.get('fecha_infor_fav_renov')?.value);
    hastaFechaNotResRenovacion.setFullYear(hastaFechaNotResRenovacion.getFullYear() + 2);

    const formattedHastaFechaNotResRenovacion = formatDate(hastaFechaNotResRenovacion, 'dd/MM/yyyy', 'es-ES');

    rawTexto = rawTexto.replace(/%SOLICITANTE%/g, this.actualEmpresa);
    rawTexto = rawTexto.replace(/%NIF%/g, this.actualNif);
    rawTexto = rawTexto.replace(/%FECHARESOLUCION%/g, formattedFecha_resolucion);
    rawTexto = rawTexto.replace(/%FECHARECJUSTIFRENOVACION%/g, formattedFecha_REC_justificacion_renov);
    rawTexto = rawTexto.replace(/%REFRECRENOVACION%/g, this.form.get('ref_REC_justificacion_renov')?.value);
    rawTexto = rawTexto.replace(/%FECHAINFORMEFAVRENOVACION%/g, formattedFecha_infor_fav_renov);
    rawTexto = rawTexto.replace(/%DESDEFECHANOTRESRENOVACION%/g, formattedFecha_infor_fav_renov);
    rawTexto = rawTexto.replace(/%HASTAFECHANOTRESRENOVACION%/g, formattedHastaFechaNotResRenovacion);
    rawTexto = rawTexto.replace(/%NOMPRESIDENTIDI%/g, this.nomPresidenteIdi);

    let jsonObject;

    // Limpieza de texto
    try {
      rawTexto = this.commonService.cleanRawText(rawTexto);
    } catch (error) {
      console.error('Error al parsear JSON: ', error);
    } finally {
      jsonObject = JSON.parse(rawTexto)
    }

    // Primera página
    doc.addImage('../../../assets/images/logo-adrbalears-ils.png', 'PNG', 25, 20, 70, 10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text("Document: resolució de renovació marca", marginLeft + 110, 45);
    doc.text(`Núm. Expedient: ${this.actualIdExp}/${this.actualConvocatoria}`, marginLeft + 110, 48);
    if (this.actualEmpresa.length > maxCharsPerLine) {
      const firstLine = this.actualEmpresa.slice(0, maxCharsPerLine);
      const secondLine = this.actualEmpresa.slice(maxCharsPerLine);
      doc.text(`Sol·licitant: ${firstLine}`, x, y);
      doc.text(secondLine, x, y + 3);
      doc.text(`NIF: ${this.actualNif}`, x, y + 6);
      doc.text("Emissor (DIR3): A04003714", x, y + 9);
      doc.text(`Codi SIA: ${this.codigoSIA}`, x, y + 12);
    } else {
      doc.text(`Sol·licitant: ${this.actualEmpresa}`, x, y);
      doc.text(`NIF: ${this.actualNif}`, x, 54);
      doc.text("Emissor (DIR3): A04003714", x, 57);
      doc.text(`Codi SIA: ${this.codigoSIA}`, x, 60);
    }

    doc.setFontSize(10);
    doc.text(doc.splitTextToSize(jsonObject.intro, maxTextWidth), marginLeft, 80);
    doc.text(doc.splitTextToSize(jsonObject.fets_tit, maxTextWidth), marginLeft, 92);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(jsonObject.antecedents_1_2_3_4, maxTextWidth), marginLeft + 5, 100);


    doc.setFont('helvetica', 'bold');
    doc.text(doc.splitTextToSize(jsonObject.resolucion_tit, maxTextWidth), marginLeft, 168);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(jsonObject.resolucion, maxTextWidth), marginLeft + 5, 176);

    // Segunda página
    doc.addPage();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    lines.forEach((line, index) => {
      const y = pageHeight - 10 - (index * lineHeight);
      doc.text(line, marginLeft, y);
    })
    doc.addImage("../../../assets/images/logoVertical.png", "PNG", 25, 20, 17, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(doc.splitTextToSize(jsonObject.recursos_tit, maxTextWidth), marginLeft, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(jsonObject.recursos, maxTextWidth), marginLeft, 68);

    doc.text(doc.splitTextToSize(jsonObject.firma, maxTextWidth), marginLeft, 220)


    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.text(`${i}/${totalPages}`, pageWidth - 20, pageHeight - 10);
    }

    const pdfBlob = doc.output('blob');

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

        this.documentosGeneradosService.deleteByIdSolNifConvoTipoDoc(this.actualID, this.actualNif, String(this.actualConvocatoria), 'doc_renovacion_resolucion_renovacion_marca_ils')
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
          })
      }
    })

  }

  private tieneTodosLosCamposRequeridos(): void {
    this.camposVacios = [];
    this.faltanCampos = false;

    const fecha_resolucion = this.form.get('fecha_resolucion')?.value;
    const fecha_REC_justificacion_renov = this.form.get('fecha_REC_justificacion_renov')?.value;
    const ref_REC_justificacion_renov = this.form.get('ref_REC_justificacion_renov')?.value;
    const fecha_infor_fav_renov = this.form.get('fecha_infor_fav_renov')?.value;

    if (!fecha_resolucion?.trim() || fecha_resolucion?.trim() === "0000-00-00") {
      this.camposVacios.push('FORM.RESOLUTION-DATE')
    }

    if (!fecha_infor_fav_renov?.trim() || fecha_infor_fav_renov?.trim() === "0000-00-00") {
      this.camposVacios.push('FORM.RENOVATION-FAVORABLE-DATE')
    }

    if (!fecha_REC_justificacion_renov?.trim() || fecha_REC_justificacion_renov?.trim() === "0000-00-00 00:00:00") {
      this.camposVacios.push('FORM.REC-JUSTIFICATION-DATE')
    }

    if (!ref_REC_justificacion_renov?.trim()) {
      this.camposVacios.push('FORM.REC-JUSTIFICATION-REF')
    }

    this.faltanCampos = this.camposVacios.length > 0;

  }

  insertDocumentoGenerado(docFieldToUpdate: string): void {
    this.documentosGeneradosService.create(this.docGeneradoInsert).subscribe({
      next: (resp: any) => {
        this.lastInsertId = resp?.id;
        if (this.lastInsertId) {
          this.expedienteService
            .updateFieldExpediente(this.actualID, `doc_${docFieldToUpdate}`, String(this.lastInsertId))
            .subscribe({
              next: (response: any) => {
                const mensaje =
                  response?.message || '✅ Acto administrativo generado y expediente actualizado correctamente.';
                this.actoAdmin = true;
                this.commonService.showSnackBar(mensaje);
              },
              error: (updateErr) => {
                const updateErrorMsg =
                  updateErr?.error?.message ||
                  '⚠️ Documento generado, pero error al actualizar el expediente.';
                this.commonService.showSnackBar(updateErrorMsg);
              }
            })
        } else {
          this.commonService.showSnackBar(
            '⚠️ Documento generado, pero no se recibió el ID para actualizar el expediente.'
          );
        }
      }
    })
  }

  getActoAdminDetail(): void {
    this.documentosGeneradosService.getDocumentosGenerados(this.actualID, this.actualNif, this.actualConvocatoria, 'doc_renovacion_resolucion_renovacion_marca_ils')
      .subscribe({
        next: (docActoAdmin: DocumentoGeneradoDTO[]) => {
          this.actoAdmin = false;
          if (docActoAdmin.length === 1) {
            this.actoAdmin = true;
            this.timeStampDocGenerado = docActoAdmin[0].selloDeTiempo;
            this.nameDocGenerado = docActoAdmin[0].name;
            this.lastInsertId = docActoAdmin[0].id;
            this.publicAccessId = docActoAdmin[0].publicAccessId;
            if (this.publicAccessId) {
              this.getSignState(this.publicAccessId);
            }
          }
        },
        error: (err) => {
          console.error('Error obteniendo documentos', err);
          this.actoAdmin = false;
        }
      })
  }

  viewActoAdmin(nif: string, folder: string, filename: string, extension: string): void {
    const entorno = environment.apiUrl;
    filename = filename.replace(/^doc_/, "");
    filename = `${this.actualIdExp}_${this.actualConvocatoria}_${filename}`;
    const url = `${entorno}/documents/view/${nif}/${folder}/${filename}`;

    const sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);

    const ext = extension.toLowerCase();
    if (ext === "jpg" || ext === "jpeg") {
      this.showPdfViewer = false;
      this.pdfUrl = null;
    } else {
      this.showPdfViewer = true;
      this.pdfUrl = sanitizedUrl;
    }
  }

  closeViewActoAdmin(): void {
    this.showPdfViewer = false;
    this.pdfUrl = null;
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

  sendActoAdminToSign(nif: string, filename: string): void {
    // Limpiar estados previos
    this.response = undefined;
    this.error = undefined;
    this.loading = true;
    filename = filename.replace(/^doc_/, "");
    filename = `${this.actualIdExp}_${this.actualConvocatoria}_${filename}`;

    let email: string = "";

    switch (this.signedBy) {
      case 'technician':
        email = this.technicianEmail;
        break;
      case 'ceo':
        email = this.ceoEmail;
        break;

      case 'conseller':
        // ToDo
        email = this.consellerEmail;
        break;

      case 'applicant':
        email = this.form.get('email_rep')?.value;
        break;
    }

    const payload: CreateSignatureRequest = {
      adreca_mail: email,
      nombreDocumento: filename,
      nif: nif,
      last_insert_id: this.lastInsertId
    };

    this.viafirmaService.createSignatureRequest(payload)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (resp) => {
          this.response = resp;
          const id = resp?.publicAccessId;
          this.publicAccessId = id ?? '';
          this.commonService.showSnackBar(id ? `Solicitud de firma creada. ID: ${id} y enviada a la dirección: ${payload.adreca_mail}` : 'Solicitud de firma creada correctamente');
          this.getSignState(this.publicAccessId);
        },
        error: (err) => {
          const msg = err?.error?.message || err?.message || 'No se pudo enviar la solicitud de firma';
          this.error = msg;
          this.commonService.showSnackBar(msg);
        }
      })

  }

  getLineDetail(convocatoria: number) {
    this.lineaAyuda.getAll().subscribe((lineaAyudaItems: PindustLineaAyudaDTO[]) => {
      this.lineDetail = lineaAyudaItems.filter((item: PindustLineaAyudaDTO) => {
        return item.convocatoria === convocatoria && item.lineaAyuda === "ILS" && item.activeLineData === "SI";
      });
      if (this.lineDetail.length > 0) {
        this.codigoSIA = this.lineDetail[0]['codigoSIA']
      }
    })
  }

  getGlobalConfig() {
    this.configGlobal.getActive().subscribe((globalConfig: ConfigurationModelDTO[]) => {
      /* Quitar hardcodeo de emails */
      // this.ceoEmail = globalConfig[0].eMailDGerente;
      // this.consellerEmail = globalConfig[0].eMailPresidente;

      this.nomPresidenteIdi = globalConfig[0].respresidente;

      this.ceoEmail = 'jose.luis@idi.es'
      this.consellerEmail = 'jldejesus@adrbalears.caib.es'
    })
  }
}
