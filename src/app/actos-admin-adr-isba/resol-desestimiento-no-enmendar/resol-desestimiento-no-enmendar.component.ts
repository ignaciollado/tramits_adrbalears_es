import { CommonModule, formatDate } from '@angular/common';
import { Component, inject, Input, SimpleChange } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { jsPDF } from 'jspdf';
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
  selector: 'app-resol-desestimiento-no-enmendar-adr-isba',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, MatExpansionModule, MatButtonModule],
  templateUrl: './resol-desestimiento-no-enmendar.component.html',
  styleUrl: './resol-desestimiento-no-enmendar.component.scss'
})
export class ResolDesestimientoNoEnmendarAdrIsbaComponent {
  private expedienteService = inject(ExpedienteService);
  actoAdmin2: boolean = false;
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
  signedBy!: string;

  @Input() actualID!: number;
  @Input() actualIdExp!: number;
  @Input() actualNif: string = "";
  @Input() actualConvocatoria!: number;
  @Input() actualTipoTramite!: string;
  @Input() actualEmpresa: string = "";
  @Input() form!: FormGroup;

  constructor(private commonService: CommonService, private sanitizer: DomSanitizer,
    private viafirmaService: ViafirmaService,
    private documentosGeneradosService: DocumentosGeneradosService,
    private actoAdminService: ActoAdministrativoService) {
    this.userLoginEmail = sessionStorage.getItem('tramits_user_email') || "";
  }

  get stateClassActAdmin2(): string {
    const map: Record<string, string> = {
      NOT_STARTED: 'req-state--not-started',
      IN_PROCESS: 'req-state--in-process',
      COMPLETED: 'req-state--completed',
      REJECTED: 'req-state--rejected',
    };
    return map[this.signatureDocState ?? ''] ?? 'req-state--not-started';
  }

  ngOnChanges(changes: SimpleChange): void {
    if (this.tieneTodosLosValores()) {
      this.getActoAdminDetail();
    }
  }

  ngOnInit(): void {
    this.actoAdminService.getByNameAndTipoTramite('isba_2_resolucion_desestimiento_por_no_enmendar', 'ADR-ISBA').subscribe((docDataString: ActoAdministrativoDTO) => {
      this.signedBy = docDataString.signedBy;
    }).unsubscribe;
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
    this.documentosGeneradosService.getDocumentosGenerados(this.actualID, this.actualNif, this.actualConvocatoria, 'doc_res_desestimiento_por_no_enmendar')
      .subscribe({
        next: (docActoAdmin2: DocumentoGeneradoDTO[]) => {
          this.actoAdmin2 = false;
          if (docActoAdmin2.length === 1) {
            this.actoAdmin2 = true;
            this.nifDocGenerado = docActoAdmin2[0].cifnif_propietario;
            this.timeStampDocGenerado = docActoAdmin2[0].selloDeTiempo;
            this.nameDocGenerado = docActoAdmin2[0].name;
            this.lastInsertId = docActoAdmin2[0].id;
            this.publicAccessId = docActoAdmin2[0].publicAccessId;

            if (this.publicAccessId) {
              this.getSignState(this.publicAccessId);
            }
          }
        },
        error: (err) => {
          console.error('Error obteniendo documentos', err);
          this.actoAdmin2 = false;
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
      title: `${this.actualIdExp + '_' + this.actualConvocatoria + '_' + docFieldToUpdate}`,
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

    this.actoAdminService.getByNameAndTipoTramite(actoAdministrativoName, tipo_tramite)
      .subscribe((docDataString: ActoAdministrativoDTO) => {
        let rawTexto = docDataString.texto;
        this.signedBy = docDataString.signedBy
        if (!rawTexto) {
          this.commonService.showSnackBar('❌ No se encontró el texto del acto administrativo.');
          return
        }

        /* Formateo las fechas para el acto administrativo */
        const formattedFecha_REC = formatDate(this.form.get('fecha_REC')?.value, 'dd/MM/yyyy', 'es-ES');
        const formattedFecha_notif= formatDate(this.form.get('fecha_requerimiento_notif')?.value, 'dd/MM/yyyy', 'es-ES');

        /* Formateo los importes monetarios */
        const formattedImporte_ayuda = this.commonService.formatCurrency(this.form.get('importe_ayuda_solicita_idi_isba')?.value);
        const formattedImporte_intereses = this.commonService.formatCurrency(this.form.get('intereses_ayuda_solicita_idi_isba')?.value);
        const formattedImporte_aval = this.commonService.formatCurrency(this.form.get('coste_aval_solicita_idi_isba')?.value);
        const formattedImporte_estudios = this.commonService.formatCurrency(this.form.get('gastos_aval_solicita_idi_isba')?.value);

        rawTexto = rawTexto.replace(/%NIF%/g, this.actualNif);
        rawTexto = rawTexto.replace(/%SOLICITANTE%/g, this.actualEmpresa);
        rawTexto = rawTexto.replace(/%CONVO%/g, String(this.actualConvocatoria));
        rawTexto = rawTexto.replace(/%FECHASOLICITUD%/g, formattedFecha_REC);
        rawTexto = rawTexto.replace(/%FECHA_NOTIFICACION_REQUERIMIENTO%/g, formattedFecha_notif);
        rawTexto = rawTexto.replace(/%IMPORTEAYUDA%/g, `${formattedImporte_ayuda}`);
        rawTexto = rawTexto.replace(/%IMPORTE_INTERESES%/g, `${formattedImporte_intereses}`);
        rawTexto = rawTexto.replace(/%IMPORTE_AVAL%/g, `${formattedImporte_aval}`);
        rawTexto = rawTexto.replace(/%IMPORTE_ESTUDIO%/g, `${formattedImporte_estudios}`);
        /* Quedan pendiente: FECHAPUBBOIB, BOIBNUM, RESPRESIDENTE, DGERENTE */

        let jsonObject;

        // Limpieza de texto
        try {
          rawTexto = this.commonService.cleanRawText(rawTexto);
        } catch (error) {
          console.error('Error al parsear JSON: ', error);
        } finally {
          jsonObject = JSON.parse(rawTexto);
        }

        /* Cabecera */
        doc.setFont('helvetica', 'bold');
        doc.addImage("../../../assets/images/logo-adrbalears-ceae-byn.png", "PNG", 25, 20, 75, 15);
        doc.setFontSize(8);

        const maxCharsPerLine = 21;
        const marginLeft = 25;
        const maxTextWidth = 160;
        const lineHeight = 4;
        const pageHeight = doc.internal.pageSize.getHeight();
        const x = marginLeft + 110;
        const y = 51;

        doc.text("Document: resolució desistiment", x, 45);
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
        doc.text(doc.splitTextToSize(jsonObject.intro, maxTextWidth), marginLeft, 90);
        doc.text(doc.splitTextToSize(jsonObject.antecedentes, maxTextWidth), marginLeft, 120);

        doc.setFont('helvetica', 'normal');
        doc.text(doc.splitTextToSize(jsonObject.p1, maxTextWidth), marginLeft + 5, 127)
        doc.text(doc.splitTextToSize(jsonObject.p2, maxTextWidth), marginLeft + 5, 150)
        doc.text(doc.splitTextToSize(jsonObject.p3, maxTextWidth), marginLeft + 5, 167)
        doc.text(doc.splitTextToSize(jsonObject.p4, maxTextWidth), marginLeft + 5, 192)
        doc.text(doc.splitTextToSize(jsonObject.p5, maxTextWidth), marginLeft + 5, 212)

        // Nueva página
        doc.addPage();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        lines.forEach((line, index) => {
          const y = pageHeight - 10 - (index * lineHeight);
          doc.text(line, marginLeft, y);
        });
        doc.addImage("../../../assets/images/logoVertical.png", "PNG", 25, 20, 18, 20);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(doc.splitTextToSize(jsonObject.fundamentosDeDerecho_tit, maxTextWidth), marginLeft, 60);
        doc.setFont('helvetica', 'normal');
        doc.text(doc.splitTextToSize(jsonObject.fundamentosDeDerechoTxt, maxTextWidth), marginLeft + 5, 70)
        doc.text(doc.splitTextToSize(jsonObject.fundamentosDeDerechoTxt_5_6_7_8_9, maxTextWidth), marginLeft + 5, 112);
        doc.text(doc.splitTextToSize(jsonObject.dicto, maxTextWidth), marginLeft, 190);
        doc.setFont('helvetica', 'bold');
        doc.text(doc.splitTextToSize(jsonObject.resolucion, maxTextWidth), marginLeft, 200);
        doc.setFont('helvetica', 'normal');
        doc.text(doc.splitTextToSize(jsonObject.resolucion_1, maxTextWidth), marginLeft + 5, 208);
        doc.text(doc.splitTextToSize(jsonObject.resolucion_2, maxTextWidth), marginLeft + 5, 228);

        // Nueva página
        doc.addPage();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        lines.forEach((line, index) => {
          const y = pageHeight - 10 - (index * lineHeight);
          doc.text(line, marginLeft, y);
        });
        doc.addImage("../../../assets/images/logoVertical.png", "PNG", 25, 20, 18, 20);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(doc.splitTextToSize(jsonObject.recursos, maxTextWidth), marginLeft, 60);
        doc.setFont('helvetica', 'normal');
        doc.text(doc.splitTextToSize(jsonObject.recursos_1, maxTextWidth), marginLeft, 70);
        doc.text(doc.splitTextToSize(jsonObject.recursos_2, maxTextWidth), marginLeft, 100);
        doc.text(doc.splitTextToSize(jsonObject.firma, maxTextWidth), marginLeft, 210);


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
            /* Delete documentos previamente generados para evitar duplicados */
            this.documentosGeneradosService.deleteByIdSolNifConvoTipoDoc(this.actualID, this.actualNif, this.actualConvocatoria, 'doc_res_desestimiento_por_no_enmendar')
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
      })
  }

  /**
   * Método que revisa si tiene todos los campos requeridos para la generación del acto administrativo
  */
  private tieneTodosLosCamposRequeridos(): void {
    this.camposVacios = [];
    this.faltanCampos = false;
    const fecha_REC = this.form.get('fecha_REC')?.value;
    const ref_REC = this.form.get('ref_REC')?.value;
    const fecha_requerimiento_notif = this.form.get('fecha_requerimiento_notif')?.value;

    if (!fecha_REC?.trim() || fecha_REC?.trim() === "0000-00-00 00:00:00") {
      this.camposVacios.push('FORM.FECHA_REC')
    }

    if (!ref_REC?.trim()) {
      this.camposVacios.push('FORM.REF_REC')
    }

    if (!fecha_requerimiento_notif?.trim() || fecha_requerimiento_notif?.trim() === "0000-00-00") {
      this.camposVacios.push('FORM.FECHA_REQUERIMIENTO_NOTIF')
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

                this.actoAdmin2 = true;
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
    if (entorno === "tramits") {
      url = `https://tramits.idi.es/public/index.php/documents/view/${nif}/${folder}/${filename}`;
    } else {
      url = `https://pre-tramits.idi.es/public/index.php/documents/view/${nif}/${folder}/${filename}`;
    }

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
      adreca_mail: this.signedBy === 'ceo' ? this.ceoEmail : this.userLoginEmail,
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
          this.getSignState(this.publicAccessId)
        },
        error: (err) => {
          const msg = err?.error?.message || err?.message || 'No se pudo enviar la solicitud de firma';
          this.error = msg;
          this.commonService.showSnackBar(msg);
        }
      });
  }

  getSignState(publicAccessId: string) {
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