import { CommonModule, formatDate } from '@angular/common';
import { Component, inject, Input, SimpleChanges } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { TranslateModule } from '@ngx-translate/core';
import { ExpedienteService } from '../../Services/expediente.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CreateSignatureRequest, SignatureResponse } from '../../Models/signature.dto';
import { ConfigurationModelDTO } from '../../Models/configuration.dto';
import { PindustLineaAyudaDTO } from '../../Models/linea-ayuda-dto';
import { DocumentoGeneradoDTO } from '../../Models/documentos-generados-dto';
import { ActoAdministrativoDTO } from '../../Models/acto-administrativo-dto';
import { FormGroup } from '@angular/forms';
import { ActoAdministrativoService } from '../../Services/acto-administrativo.service';
import { CommonService } from '../../Services/common.service';
import { DocumentosGeneradosService } from '../../Services/documentos-generados.service';
import { PindustLineaAyudaService } from '../../Services/linea-ayuda.service';
import { PindustConfiguracionService } from '../../Services/pindust-configuracion.service';
import { ViafirmaService } from '../../Services/viafirma.service';
import { finalize } from 'rxjs';
import { DocSignedDTO } from '../../Models/docsigned.dto';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-resol-denegacion-con-requerimiento-ils',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatButtonModule, MatExpansionModule],
  templateUrl: './resol-denegacion-con-requerimiento.component.html',
  styleUrl: './resol-denegacion-con-requerimiento.component.scss'
})
export class ResolDenegacionConRequerimientoIlsComponent {
  private expedienteService = inject(ExpedienteService);
  actoAdmin: boolean = false;
  sendedToSign: boolean = false;
  signatureDocState: string = "";
  nifDocGenerado: string = "";
  timeStampDocGenerado: string = "";
  userLoginEmail: string = "";
  ceoEmail: string = "";
  pdfUrl: SafeResourceUrl | null = null;
  showPdfViewer: boolean = false;
  nameDocGenerado: string = "";
  loading: boolean = false;
  response?: SignatureResponse;
  error?: string;
  globalDetail: ConfigurationModelDTO[] = [];
  lineDetail: PindustLineaAyudaDTO[] = []
  codigoSIA: string = "";
  nomPresidenteIdi: string = "";
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
  };

  lastInsertId: number | undefined;
  publicAccessId: string = "";
  externalSignUrl: string = "";
  sendedUserToSign: string = "";
  sendedDateToSign!: Date;
  faltanCampos: boolean = false;
  camposVacios: string[] = [];
  signedBy!: string;

  docDataString!: ActoAdministrativoDTO;
  emailConseller!: string;

  @Input() actualID!: number;
  @Input() actualIdExp!: number;
  @Input() actualNif: string = "";
  @Input() actualConvocatoria!: number;
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
    this.userLoginEmail = sessionStorage.getItem('tramits_user_email') || '';
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
    this.actoAdminService.getByNameAndTipoTramite('ILS_6_resolucion_denegacion_con_requerimiento', 'ILS')
      .subscribe((docDataString: ActoAdministrativoDTO) => {
        this.docDataString = docDataString;
        this.signedBy = this.docDataString.signedBy
      })
  }

  ngOnChanges(changes: SimpleChanges): void {
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

  getActoAdminDetail(): void {
    this.documentosGeneradosService.getDocumentosGenerados(this.actualID, this.actualNif, this.actualConvocatoria, 'doc_res_denegacion_con_req_ils')
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

  generateActoAdmin(docFieldToUpdate: string): void {
    this.tieneTodosLosCamposRequeridos()
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
    const formattedFecha_REC = formatDate(this.form.get('fecha_REC')?.value, 'dd/MM/yyyy HH:mm:ss', 'es-ES');
    const formattedFecha_REC_enmienda = formatDate(this.form.get('fecha_REC_enmienda')?.value, 'dd/MM/yyyy HH:mm:ss', 'es-ES');
    const formattedFecha_requerimiento_notif = formatDate(this.form.get('fecha_requerimiento_notif')?.value, 'dd/MM/yyyy', 'es-ES');
    const formattedFecha_infor_desf = formatDate(this.form.get('fecha_infor_desf')?.value, 'dd/MM/yyyy', 'es-ES');

    rawTexto = rawTexto.replace(/%SOLICITANTE%/g, this.actualEmpresa);
    rawTexto = rawTexto.replace(/%NIF%/g, this.actualNif);
    rawTexto = rawTexto.replace(/%FECHAREC%/g, formattedFecha_REC);
    rawTexto = rawTexto.replace(/%NUMREC%/g, this.form.get('ref_REC')?.value);
    rawTexto = rawTexto.replace(/%FECHANOTIF%/g, formattedFecha_requerimiento_notif);
    rawTexto = rawTexto.replace(/%FECHAENMIENDA%/g, formattedFecha_REC_enmienda);
    rawTexto = rawTexto.replace(/%NUMENMIENDAREC%/g, this.form.get('ref_REC_enmienda')?.value);
    rawTexto = rawTexto.replace(/%FECHAINFORDESF%/g, formattedFecha_infor_desf);
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
    doc.text("Document: resolució de denegació", marginLeft + 110, 45);
    doc.text(`Núm. Expedient: ${this.actualIdExp}/${this.actualConvocatoria}`, marginLeft + 110, 48);
    if (this.actualEmpresa.length > maxCharsPerLine) {
      const firstLine = this.actualEmpresa.slice(0, maxCharsPerLine);
      const secondLine = this.actualEmpresa.slice(maxCharsPerLine);
      doc.text(`Nom sol·licitant: ${firstLine}`, x, y);
      doc.text(secondLine, x, y + 3);
      doc.text(`NIF: ${this.actualNif}`, x, y + 6);
      doc.text("Emissor (DIR3): A04003714", x, y + 9);
      doc.text(`Codi SIA: ${this.codigoSIA}`, x, y + 12);
    } else {
      doc.text(`Nom sol·licitant: ${this.actualEmpresa}`, x, y);
      doc.text(`NIF: ${this.actualNif}`, x, 54);
      doc.text("Emissor (DIR3): A04003714", x, 57);
      doc.text(`Codi SIA: ${this.codigoSIA}`, x, 60);
    }

    doc.setFontSize(10);
    doc.text(doc.splitTextToSize(jsonObject.intro, maxTextWidth), marginLeft, 80);
    doc.text(doc.splitTextToSize(jsonObject.antecedentes, maxTextWidth), marginLeft, 92);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(jsonObject.p1, maxTextWidth), marginLeft + 5, 100);
    doc.text(doc.splitTextToSize(jsonObject.p2, maxTextWidth), marginLeft + 5, 116);
    doc.text(doc.splitTextToSize(jsonObject.p3, maxTextWidth), marginLeft + 5, 128);
    doc.text(doc.splitTextToSize(jsonObject.p4, maxTextWidth), marginLeft + 5, 140);
    doc.text(doc.splitTextToSize(jsonObject.p5, maxTextWidth), marginLeft + 5, 156);
    doc.text(doc.splitTextToSize(jsonObject.p6, maxTextWidth), marginLeft + 5, 168);

    doc.setFont('helvetica', 'bold');
    doc.text(doc.splitTextToSize(jsonObject.resol_intro, maxTextWidth), marginLeft, 184);
    doc.setFont('helvetica', 'normal')
    doc.text(doc.splitTextToSize(jsonObject.resol_p1, maxTextWidth), marginLeft + 5, 192);
    doc.text(doc.splitTextToSize(jsonObject.resol_p2, maxTextWidth), marginLeft + 5, 204);
    doc.text(doc.splitTextToSize(jsonObject.resol_p3, maxTextWidth), marginLeft + 5, 212);

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
    doc.text(doc.splitTextToSize(jsonObject.recursos_intro, maxTextWidth), marginLeft, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(jsonObject.recursos_p1, maxTextWidth), marginLeft, 68);
    doc.text(doc.splitTextToSize(jsonObject.recursos_p2, maxTextWidth), marginLeft, 96);

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

        this.documentosGeneradosService.deleteByIdSolNifConvoTipoDoc(this.actualID, this.actualNif, String(this.actualConvocatoria), 'doc_res_denegacion_con_req_ils')
          .subscribe({
            next: () => {
              this.insertDocumentoGenerado(docFieldToUpdate)
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
    this.faltanCampos = false;
    this.camposVacios = [];

    const fecha_REC = this.form.get('fecha_REC')?.value;
    const ref_REC = this.form.get('ref_REC')?.value;
    const fecha_requerimiento_notif = this.form.get('fecha_requerimiento_notif')?.value;
    const fecha_REC_enmienda = this.form.get('fecha_REC_enmienda')?.value;
    const ref_REC_enmienda = this.form.get('ref_REC_enmienda')?.value;
    const fecha_infor_desf = this.form.get('fecha_infor_desf')?.value;

    if (!fecha_REC?.trim() || fecha_REC?.trim() === "0000-00-00 00:00:00") {
      this.camposVacios.push('FORM.FECHA_REC');
    }
    if (!fecha_REC_enmienda?.trim() || fecha_REC_enmienda?.trim() === "0000-00-00 00:00:00") {
      this.camposVacios.push('FORM.FECHA_REC_ENMIENDA');
    }

    if (!fecha_requerimiento_notif?.trim() || fecha_requerimiento_notif?.trim() === "0000-00-00") {
      this.camposVacios.push('FORM.FECHA_REQUERIMIENTO_NOTIF')
    }

    if (!fecha_infor_desf?.trim() || fecha_infor_desf?.trim() === "0000-00-00") {
      this.camposVacios.push('FORM.UNFAVORABLE-DATE')
    }

    if (!ref_REC?.trim()) {
      this.camposVacios.push('FORM.REF_REC')
    }

    if (!ref_REC_enmienda?.trim()) {
      this.camposVacios.push('FORM.REF_REC_ENMIENDA')
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
        email = this.userLoginEmail;
        break;
      case 'ceo':
        email = this.ceoEmail;
        break;
      case 'applicant':
        email = this.form.get('email_rep')?.value;
        break;
      case 'conseller':
        // ToDo
        email = this.emailConseller;
        break;
    }

    const payload: CreateSignatureRequest = {
      adreca_mail: email,
      nombreDocumento: filename,
      nif: nif,
      last_insert_id: this.lastInsertId
    }

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
    this.configGlobal.getActive().subscribe((globalConfigArr: ConfigurationModelDTO[]) => {
      const globalConfig = globalConfigArr[0];
        this.nomPresidenteIdi = globalConfig.respresidente;
        // this.emailConseller = globalConfig.eMailPresidente || ''
        this.emailConseller = ''
    })
  }
}
