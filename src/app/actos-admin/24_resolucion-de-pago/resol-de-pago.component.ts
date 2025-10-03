import { CommonModule, formatDate } from '@angular/common';
import { Component, inject, Input, SimpleChanges } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import jsPDF from 'jspdf';
import { finalize } from 'rxjs';
import { ActoAdministrativoDTO } from '../../Models/acto-administrativo-dto';
import { ConfigurationModelDTO } from '../../Models/configuration.dto';
import { DocSignedDTO } from '../../Models/docsigned.dto';
import { DocumentoGeneradoDTO } from '../../Models/documentos-generados-dto';
import { PindustLineaAyudaDTO } from '../../Models/linea-ayuda-dto';
import { CreateSignatureRequest, SignatureResponse } from '../../Models/signature.dto';
import { ActoAdministrativoService } from '../../Services/acto-administrativo.service';
import { CommonService } from '../../Services/common.service';
import { DocumentosGeneradosService } from '../../Services/documentos-generados.service';
import { ExpedienteService } from '../../Services/expediente.service';
import { PindustLineaAyudaService } from '../../Services/linea-ayuda.service';
import { PindustConfiguracionService } from '../../Services/pindust-configuracion.service';
import { ViafirmaService } from '../../Services/viafirma.service';

@Component({
  selector: 'app-resol-de-pago',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, ReactiveFormsModule, MatInputModule, TranslateModule, MatFormFieldModule, MatButtonModule],
  templateUrl: './resol-de-pago.component.html',
  styleUrl: './resol-de-pago.component.scss'
})
export class ResolDePagoComponent {
  private expedienteService = inject(ExpedienteService);
  actoAdmin24: boolean = false;
  sendedToSign: boolean = false;
  signatureDocState: string = "";
  nifDocGenerado: string = "";
  timeStampDocGenerado: string = "";
  userLoginEmail: string = "";
  ceoEmail: string = "jose.luis@idi.es";
  pdfUrl: SafeResourceUrl | null = null;
  imageUrl: SafeUrl | undefined;
  showPdfViewer: boolean = false;
  showImageViewer: boolean = false;
  nameDocGenerado: string = "";
  loading: boolean = false;
  response?: SignatureResponse;
  error?: string;
  globalDetail: ConfigurationModelDTO[] = [];
  lineDetail: PindustLineaAyudaDTO[] = [];
  num_BOIB: string = "";
  fecha_BOIB: string = "";
  codigoSIA: string = "";
  dGerente: string = "";
  nomPresidenteIdi: string = "";
  fechaResPresidente: string = "";

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
  signedBy!: string;
  faltanCampos: boolean = false;
  camposVacios: string[] = [];

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
    private documentoGeneradosService: DocumentosGeneradosService,
    private actoAdminService: ActoAdministrativoService,
    private lineaAyuda: PindustLineaAyudaService,
    private configGlobal: PindustConfiguracionService
  ) { this.userLoginEmail = sessionStorage.getItem("tramits_user_email") || ""; };

  get stateClass(): string {
    const map: Record<string, string> = {
      NOT_STARTED: 'req-state--not-started',
      IN_PROCESS: 'req-state--in-process',
      COMPLETED: 'req-state--completed',
      REJECTED: 'req-state--rejected',
    }
    return map[this.signatureDocState ?? ''] ?? 'req-state--not-started';
  }

  ngOnInit(): void {
    this.actoAdminService.getByNameAndTipoTramite('24_resolucion_pago_sin_requerimiento', 'XECS')
      .subscribe((docDataString: ActoAdministrativoDTO) => {
        this.signedBy = docDataString.signedBy;
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
    )
  }

  getActoAdminDetail(): void {
    this.documentoGeneradosService.getDocumentosGenerados(this.actualID, this.actualNif, this.actualConvocatoria, 'doc_resolucion_pago_sin_requerimiento')
      .subscribe({
        next: (docActoAdmin: DocumentoGeneradoDTO[]) => {
          this.actoAdmin24 = false;
          if (docActoAdmin.length === 1) {
            this.actoAdmin24 = true;
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
          this.actoAdmin24 = false;
        }
      })
  }

  generateActoAdmin(actoAdministrativoName: string, tipoTramite: string, docFieldToUpdate: string): void {
    this.tieneTodosLosCamposRequeridos();
    if (this.faltanCampos) { return; }

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
      doc.text(line, marginLeft, y);
    });

    this.actoAdminService.getByNameAndTipoTramite(actoAdministrativoName, tipoTramite)
      .subscribe((docDataString: ActoAdministrativoDTO) => {
        let rawTexto = docDataString.texto;
        this.signedBy = docDataString.signedBy;

        if (!rawTexto) {
          this.commonService.showSnackBar('❌ No se encontró el texto del acto administrativo.');
          return;
        }

        /* Fechas formateadas */
        const formattedBOIBFecha = this.fecha_BOIB !== "" ? formatDate(this.fecha_BOIB, 'dd/MM/yyyy', 'es-ES') : "%BOIBFECHA%";
        const formattedFechaResPresidente = this.fechaResPresidente !== "" ? formatDate(this.fechaResPresidente, 'dd/MM/yyyy', 'es-ES') : "%FECHARESPRESIDI%";
        const formattedFecha_sol = formatDate(this.form.get('fecha_solicitud')?.value, 'dd/MM/yyyy HH:mm:ss', 'es-ES');
        const formattedFecha_prop_resol_provisional = formatDate(this.form.get('fecha_firma_propuesta_resolucion_prov')?.value, 'dd/MM/yyyy', 'es-ES');
        const formattedFecha_notif_pr_prov = formatDate(this.form.get('fecha_not_propuesta_resolucion_prov')?.value, 'dd/MM/yyyy', 'es-ES');
        const formattedFecha_pr_definitiva = formatDate(this.form.get('fecha_firma_propuesta_resolucion_def')?.value, 'dd/MM/yyyy', 'es-ES');
        const formattedFecha_notif_pr_definitiva = formatDate(this.form.get('fecha_not_propuesta_resolucion_def')?.value, 'dd/MM/yyyy', 'es-ES');
        const formattedFecha_firma_res = formatDate(this.form.get('fecha_firma_res')?.value, 'dd/MM/yyyy', 'es-ES');
        const formattedFecha_REC_justificacion = formatDate(this.form.get('fecha_REC_justificacion')?.value, 'dd/MM/yyyy', 'es-ES');

        /* Importes monetarios formateados */
        const formattedImporteAyuda = this.commonService.formatCurrency(this.form.get('importeAyuda')?.value);

        rawTexto = rawTexto.replace(/%BOIBFECHA%/g, formattedBOIBFecha);
        rawTexto = rawTexto.replace(/%BOIBNUM%/g, this.num_BOIB);
        rawTexto = rawTexto.replace(/%FECHARESPRESIDI%/g, formattedFechaResPresidente);
        rawTexto = rawTexto.replace(/%CONVO%/g, String(this.actualConvocatoria));
        rawTexto = rawTexto.replace(/%FECHASOL%/g, formattedFecha_sol);
        rawTexto = rawTexto.replace(/%SOLICITANTE%/g, this.actualEmpresa);
        rawTexto = rawTexto.replace(/%NIF%/g, this.actualNif);
        rawTexto = rawTexto.replace(/%IMPORTEAYUDA%/g, formattedImporteAyuda);
        rawTexto = rawTexto.replace(/%PROGRAMA%/g, this.actualTipoTramite);
        rawTexto = rawTexto.replace(/%FECHA_PROP_RESOL_PROVISIONAL%/g, formattedFecha_prop_resol_provisional);
        rawTexto = rawTexto.replace(/%FECHA_NOTIF_PRPROV%/g, formattedFecha_notif_pr_prov);
        rawTexto = rawTexto.replace(/%FECHA_PR_DEFINITIVA%/g, formattedFecha_pr_definitiva);
        rawTexto = rawTexto.replace(/%FECHA_NOTIF_PRPDEF%/g, formattedFecha_notif_pr_definitiva);
        rawTexto = rawTexto.replace(/%FECHA_RESOL_CONCE%/g, formattedFecha_firma_res);
        rawTexto = rawTexto.replace(/%FECHA_SEDE_JUSTIFICACION%/g, formattedFecha_REC_justificacion);
        rawTexto = rawTexto.replace(/%DGERENTE%/g, this.dGerente);

        let jsonObject;

        // Limpieza de texto
        try {
          rawTexto = this.commonService.cleanRawText(rawTexto);
        } catch (error) {
          console.error('Error al parsear JSON: ', error);
        } finally {
          jsonObject = JSON.parse(rawTexto)
        }

        const maxCharsPerLine = 21;
        const marginLeft = 25;
        const maxTextWidth = 160;
        const x = marginLeft + 110;
        const y = 54;

        // Primera página
        doc.setFont('helvetica', 'bold');
        doc.addImage('../../../assets/images/logo-adrbalears-ceae-byn.png', 25, 20, 75, 15);
        doc.setFontSize(8);
        doc.text(doc.splitTextToSize('Document: Resolució de pagament', maxTextWidth), x, 45);
        doc.text(`Núm. Expedient: ${this.actualIdExp}/${this.actualConvocatoria}`, x, 48);
        doc.text(`Programa: ${this.actualTipoTramite}`, x, 51)

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
          doc.text(`NIF: ${this.actualNif}`, x, 57);
          doc.text("Emissor (DIR3): A04003714", x, 60);
          doc.text(`Codi SIA: ${this.codigoSIA}`, x, 63);
        }

        doc.setFontSize(10);
        doc.text(doc.splitTextToSize(jsonObject.intro, maxTextWidth), marginLeft, 80);
        doc.text(jsonObject.fets_tit, marginLeft, 96);
        doc.setFont('helvetica', 'normal');
        doc.text(doc.splitTextToSize(jsonObject.fets_1_2_3_4_5, maxTextWidth), marginLeft + 5, 106)

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
        doc.text(jsonObject.fundamentosDeDerecho_tit, marginLeft, 60);
        doc.setFont('helvetica', 'normal');
        doc.text(doc.splitTextToSize(jsonObject.fundamentosDeDerechoTxt, maxTextWidth), marginLeft + 5, 70);

        // Tercera página
        doc.addPage();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        lines.forEach((line, index) => {
          const y = pageHeight - 10 - (index * lineHeight);
          doc.text(line, marginLeft, y);
        })
        doc.addImage("../../../assets/images/logoVertical.png", "PNG", 25, 20, 17, 22);

        doc.setFontSize(10);
        doc.text(jsonObject.dicto, marginLeft, 60);
        doc.setFont('helvetica', 'bold');
        doc.text(jsonObject.propuesta_tit, marginLeft, 70);
        doc.setFont('helvetica', 'normal');
        doc.text(doc.splitTextToSize(jsonObject.resolucion, maxTextWidth), marginLeft + 5, 80);
        doc.setFont('helvetica', 'bold');
        doc.text(jsonObject.recursos_tit, marginLeft, 105);
        doc.setFont('helvetica', 'normal');
        doc.text(doc.splitTextToSize(jsonObject.recursos, maxTextWidth), marginLeft + 5, 115);
        doc.text(doc.splitTextToSize(jsonObject.firma, maxTextWidth), marginLeft, 220);


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

            this.documentoGeneradosService.deleteByIdSolNifConvoTipoDoc(this.actualID, this.actualNif, this.actualConvocatoria, 'doc_resolucion_pago_sin_requerimiento')
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
      })

  }

  private tieneTodosLosCamposRequeridos(): void {
    this.camposVacios = [];
    this.faltanCampos = false;
    const fecha_not_propuesta_resolucion_prov = this.form.get('fecha_not_propuesta_resolucion_prov')?.value;
    const fecha_firma_propuesta_resolucion_def = this.form.get('fecha_firma_propuesta_resolucion_def')?.value;
    const fecha_firma_propuesta_resolucion_prov = this.form.get('fecha_firma_propuesta_resolucion_prov')?.value;
    const fecha_not_propuesta_resolucion_def = this.form.get('fecha_not_propuesta_resolucion_def')?.value;
    const fecha_firma_res_pago_just = this.form.get('fecha_firma_res_pago_just')?.value;
    const fecha_REC_justificacion = this.form.get('fecha_REC_justificacion')?.value;

    if (!fecha_not_propuesta_resolucion_prov?.trim() || fecha_not_propuesta_resolucion_prov?.trim() === "0000-00-00") {
      this.camposVacios.push('FORM.fecha_not_propuesta_resolucion_prov')
    }
    if (!fecha_firma_propuesta_resolucion_def?.trim() || fecha_firma_propuesta_resolucion_def?.trim() === "0000-00-00") {
      this.camposVacios.push('FORM.fecha_firma_propuesta_resolucion_def')
    }
    if (!fecha_firma_propuesta_resolucion_prov?.trim() || fecha_firma_propuesta_resolucion_prov?.trim() === "0000-00-00") {
      this.camposVacios.push('FORM.fecha_firma_propuesta_resolucion_prov')
    }
    if (!fecha_not_propuesta_resolucion_def?.trim() || fecha_not_propuesta_resolucion_def?.trim() === "0000-00-00") {
      this.camposVacios.push('FORM.fecha_not_propuesta_resolucion_def')
    }
    if (!fecha_firma_res_pago_just?.trim() || fecha_firma_res_pago_just?.trim() === "0000-00-00") {
      this.camposVacios.push('FORM.fecha_firma_res_pago_just')
    }
    if (!fecha_REC_justificacion?.trim() || fecha_REC_justificacion?.trim() === "0000-00-00 00:00:00") {
      this.camposVacios.push('FORM.fecha_REC_justificacion')
    }
    this.faltanCampos = this.camposVacios.length > 0;
  }

  insertDocumentoGenerado(docFieldToUpdate: string): void {
    this.documentoGeneradosService.create(this.docGeneradoInsert).subscribe({
      next: (resp: any) => {
        this.lastInsertId = resp?.id;
        if (this.lastInsertId) {
          this.expedienteService
            .updateDocFieldExpediente(this.actualID, `doc_${docFieldToUpdate}`, String(this.lastInsertId))
            .subscribe({
              next: (response: any) => {
                const mensaje =
                  response?.message || '✅ Acto administrativo generado y expediente actualizado correctamente.';
                this.actoAdmin24 = true;
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
      this.showImageViewer = true;
      this.showPdfViewer = false;
      this.pdfUrl = null;
      this.imageUrl = sanitizedUrl;
    } else {
      this.showImageViewer = false;
      this.showPdfViewer = true;
      this.pdfUrl = sanitizedUrl;
      this.imageUrl = undefined;
    }
  }

  closeViewActoAdmin(): void {
    this.showPdfViewer = false;
    this.pdfUrl = null;
  }

  sendActoAdminToSign(nif: string, folder: string, filename: string, extension: string): void {
    // Limpiar estados previos
    this.response = undefined;
    this.error = undefined;
    this.loading = true;
    filename = filename.replace(/^doc_/, "");
    filename = `${this.actualIdExp}_${this.actualConvocatoria}_${filename}`;

    const payload: CreateSignatureRequest = {
      adreca_mail: this.signedBy === "ceo" ? this.ceoEmail : this.userLoginEmail,
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
      })
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

  getLineDetail(convocatoria: number) {
    this.lineaAyuda.getAll().subscribe((lineaAyudaItems: PindustLineaAyudaDTO[]) => {
      this.lineDetail = lineaAyudaItems.filter((item: PindustLineaAyudaDTO) => {
        return item.convocatoria === convocatoria && item.lineaAyuda === "XECS" && item.activeLineData === "SI";
      });
      console.log("lineDetail", this.lineDetail)
      this.num_BOIB = this.lineDetail[0]['num_BOIB']
      this.codigoSIA = this.lineDetail[0]['codigoSIA']
      this.fecha_BOIB = this.lineDetail[0]['fecha_BOIB']
      this.fechaResPresidente = this.lineDetail[0]['fechaResPresidIDI'] ?? ''
    })
  }

  getGlobalConfig() {
    this.configGlobal.getActive().subscribe((globalConfig: ConfigurationModelDTO[]) => {
      this.dGerente = globalConfig[0].directorGerenteIDI;
      this.nomPresidenteIdi = globalConfig[0].respresidente;
    })
  }

}
