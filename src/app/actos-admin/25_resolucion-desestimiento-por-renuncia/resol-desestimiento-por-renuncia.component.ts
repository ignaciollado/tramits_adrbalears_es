import { CommonModule, formatDate } from '@angular/common';
import { Component, inject, Input, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { ExpedienteService } from '../../Services/expediente.service';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { CreateSignatureRequest, SignatureResponse } from '../../Models/signature.dto';
import { ConfigurationModelDTO } from '../../Models/configuration.dto';
import { PindustLineaAyudaDTO } from '../../Models/linea-ayuda-dto';
import { DocumentoGeneradoDTO } from '../../Models/documentos-generados-dto';
import { CommonService } from '../../Services/common.service';
import { ViafirmaService } from '../../Services/viafirma.service';
import { DocumentosGeneradosService } from '../../Services/documentos-generados.service';
import { ActoAdministrativoService } from '../../Services/acto-administrativo.service';
import { PindustLineaAyudaService } from '../../Services/linea-ayuda.service';
import { PindustConfiguracionService } from '../../Services/pindust-configuracion.service';
import { ActoAdministrativoDTO } from '../../Models/acto-administrativo-dto';
import { DocSignedDTO } from '../../Models/docsigned.dto';
import { finalize } from 'rxjs';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-resol-desestimiento-por-renuncia',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, MatInputModule, MatButtonModule, MatExpansionModule, MatFormFieldModule],
  templateUrl: './resol-desestimiento-por-renuncia.component.html',
  styleUrl: './resol-desestimiento-por-renuncia.component.scss'
})
export class ResolDesestimientoPorRenunciaComponent {
  private fb = inject(FormBuilder);
  private expedienteService = inject(ExpedienteService);
  formDesestimiento!: FormGroup;
  noDesestimientoReasonText: boolean = true;

  actoAdmin25: boolean = false;
  sendedToSign: boolean = false;
  signatureDocState: string = "";
  nifDocGenerado: string = "";
  timeStampDocGenerado: string = "";
  userLoginEmail: string = "";
  ceoEmail: string = "";
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
  nomPresidenteIdi: string = ""
  fechaResPresidenteIdi: string = "";

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

  @Input() actualID!: number;
  @Input() actualIdExp!: number;
  @Input() actualNif: string = "";
  @Input() actualConvocatoria!: number;
  @Input() actualTipoTramite!: string;
  @Input() actualEmpresa: string = "";
  @Input() motivoDesestimientoRenuncia: string = "";
  @Input() form!: FormGroup;


  constructor(
    private commonService: CommonService, private sanitizer: DomSanitizer,
    private viafirmaService: ViafirmaService,
    private documentoGeneradosService: DocumentosGeneradosService,
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
    this.formDesestimiento = this.fb.group({
      motivoDesestimientoRenuncia: [{ value: '', disabled: false }]
    });

    this.actoAdminService.getByNameAndTipoTramite('25_resolucion_desistimiento', 'XECS')
      .subscribe((docDataString: ActoAdministrativoDTO) => {
        this.docDataString = docDataString;
        this.signedBy = this.docDataString.signedBy;
      })
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.tieneTodosLosValores()) {
      this.getActoAdminDetail();
      this.getLineDetail(this.actualConvocatoria);
      this.getGlobalConfig();
    }

    if (this.formDesestimiento && this.motivoDesestimientoRenuncia) {
      this.formDesestimiento.get('motivoDesestimientoRenuncia')
        ?.setValue(this.motivoDesestimientoRenuncia);
    }
  }

  saveDesestimientoReason(): void {
    const motivo = this.formDesestimiento.get('motivoDesestimientoRenuncia')?.value;
    if (this.formDesestimiento.valid) {
      this.expedienteService.updateFieldExpediente(this.actualID, 'motivoDesestimientoRenuncia', motivo).subscribe();
      this.noDesestimientoReasonText = false;
      this.actoAdmin25 = false;
    }
  }

  private tieneTodosLosValores(): boolean {
    return (
      this.actualID !== null &&
      this.actualIdExp !== null &&
      !!this.actualNif && !!this.actualTipoTramite &&
      this.actualConvocatoria !== null
    )
  }

  getActoAdminDetail(): void {
    this.documentoGeneradosService.getDocumentosGenerados(this.actualID, this.actualNif, this.actualConvocatoria, 'doc_resolucion_desestimiento_renuncia')
      .subscribe({
        next: (docActoAdmin: DocumentoGeneradoDTO[]) => {
          this.actoAdmin25 = false;
          if (docActoAdmin.length === 1) {
            this.actoAdmin25 = true;
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
          this.actoAdmin25 = false;
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
    const maxCharsPerLine = 21;
    const maxTextWidth = 160;
    const x = marginLeft + 110;
    const y = 54;
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
    const formattedFecha_BOIB = this.fecha_BOIB !== "" ? formatDate(this.fecha_BOIB, 'dd/MM/yyyy', 'es-ES') : "%BOIBFECHA%"
    const formattedFechaResPresidenteiDI = this.fechaResPresidenteIdi !== "" ? formatDate(this.fechaResPresidenteIdi, 'dd/MM/yyyy', 'es-ES') : "%FECHARESPRESIDI%";
    const formattedFecha_sol = formatDate(this.form.get('fecha_solicitud')?.value, 'dd/MM/yyyy HH:mm:ss', 'es-ES');
    const formattedFecha_desestimiento = formatDate(this.form.get('fecha_REC_desestimiento')?.value, 'dd/MM/yyyy HH:mm:ss', 'es-ES');

    /* Importes monetarios formateados */
    const formattedImporteAyuda = this.commonService.formatCurrency(this.form.get('importeAyuda')?.value);

    rawTexto = rawTexto.replace(/%SOLICITANTE%/g, this.actualEmpresa);
    rawTexto = rawTexto.replace(/%NIF%/g, this.actualNif);
    rawTexto = rawTexto.replace(/%BOIBFECHA%/g, formattedFecha_BOIB);
    rawTexto = rawTexto.replace(/%BOIBNUM%/g, this.num_BOIB);
    rawTexto = rawTexto.replace(/%FECHARESPRESIDI%/g, formattedFechaResPresidenteiDI);
    rawTexto = rawTexto.replace(/%CONVO%/g, String(this.actualConvocatoria));
    rawTexto = rawTexto.replace(/%FECHASOL%/g, formattedFecha_sol);
    rawTexto = rawTexto.replace(/%IMPORTEAYUDA%/g, formattedImporteAyuda);
    rawTexto = rawTexto.replace(/%PROGRAMA%/g, this.actualTipoTramite);
    rawTexto = rawTexto.replace(/%FECHA_DESESTIMIENTO%/g, formattedFecha_desestimiento);
    rawTexto = rawTexto.replace(/%NUM_EXPEDIENTE%/g, `${String(this.actualIdExp)}/${String(this.actualConvocatoria)}`);
    rawTexto = rawTexto.replace(/%REFERENCIA_SEDE_DESESTIMIENTO%/g, this.form.get('ref_REC_desestimiento')?.value);
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

    doc.setFont('helvetica', 'bold');
    doc.addImage('../../../assets/images/logo-adrbalears-ceae-byn.png', 25, 20, 75, 15);
    doc.setFontSize(8);
    doc.text(doc.splitTextToSize('Document: resolució desistiment per renúncia', maxTextWidth), x, 45);
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
    doc.text(jsonObject.fets_tit, marginLeft, 110);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(jsonObject.fets_1_2_3, maxTextWidth), marginLeft + 5, 120)

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
       doc.text(jsonObject.resolucion_tit, marginLeft, 70);
       doc.setFont('helvetica', 'normal');
       doc.text(doc.splitTextToSize(jsonObject.resolucion, maxTextWidth), marginLeft + 5, 80);
       doc.setFont('helvetica', 'bold');
       doc.text(jsonObject.recursos_tit, marginLeft, 105);
       doc.setFont('helvetica', 'normal');
       doc.text(doc.splitTextToSize(jsonObject.recursos, maxTextWidth), marginLeft + 5, 115);
       doc.text(doc.splitTextToSize(jsonObject.firma, maxTextWidth), marginLeft, 220);

       // Numeración páginas
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

        this.documentoGeneradosService.deleteByIdSolNifConvoTipoDoc(this.actualID, this.actualNif, this.actualConvocatoria, 'doc_resolucion_desestimiento_renuncia')
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

  }

  private tieneTodosLosCamposRequeridos(): void {
    this.camposVacios = [];
    this.faltanCampos = false;

    const fecha_REC = this.form.get('fecha_REC')?.value;
    const ref_REC = this.form.get('ref_REC')?.value;
    const fecha_REC_desestimiento = this.form.get('fecha_REC_desestimiento')?.value;
    const ref_REC_desestimiento = this.form.get('ref_REC_desestimiento')?.value;

    if (!fecha_REC?.trim() || fecha_REC?.trim() === "0000-00-00 00:00:00") {
      this.camposVacios.push('FORM.FECHA_REC')
    }
    if (!fecha_REC_desestimiento?.trim() || fecha_REC_desestimiento?.trim() === "0000-00-00 00:00:00") {
      this.camposVacios.push('FORM.FECHA_REC_DESESTIMIENTO')
    }

    if (!ref_REC?.trim()) {
      this.camposVacios.push('FORM.REF_REC')
    }

    if (!ref_REC_desestimiento?.trim()) {
      this.camposVacios.push('FORM.REF_REC_DESESTIMIENTO')
    }

    this.faltanCampos = this.camposVacios.length > 0;
  }

  insertDocumentoGenerado(docFieldToUpdate: string): void {
    this.documentoGeneradosService.create(this.docGeneradoInsert).subscribe({
      next: (resp: any) => {
        this.lastInsertId = resp?.id;
        if (this.lastInsertId) {
          this.expedienteService
            .updateFieldExpediente(this.actualID, `doc_${docFieldToUpdate}`, String(this.lastInsertId))
            .subscribe({
              next: (response: any) => {
                const mensaje =
                  response?.message || '✅ Acto administrativo generado y expediente actualizado correctamente.';
                this.actoAdmin25 = true;
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
        this.sendedDateToSign = new Date(sendedDateToSign)
      })
  }

  getLineDetail(convocatoria: number): void {
    this.lineaAyuda.getAll().subscribe((lineaAyudaItems: PindustLineaAyudaDTO[]) => {
      this.lineDetail = lineaAyudaItems.filter((item: PindustLineaAyudaDTO) => {
        return item.convocatoria === convocatoria && item.lineaAyuda === "XECS" && item.activeLineData === "SI";
      });
      this.num_BOIB = this.lineDetail[0]['num_BOIB'];
      this.codigoSIA = this.lineDetail[0]['codigoSIA'];
      this.fecha_BOIB = this.lineDetail[0]['fecha_BOIB'];
      this.fechaResPresidenteIdi = this.lineDetail[0]['fechaResPresidIDI'] ?? ''
    })
  }

    getGlobalConfig() {
    this.configGlobal.getActive().subscribe((globalConfigArr: ConfigurationModelDTO[]) => {
      const globalConfig = globalConfigArr[0];
      this.dGerente = globalConfig?.directorGerenteIDI ?? '';
      this.nomPresidenteIdi = globalConfig?.respresidente;
    })
  }
}
