import { CommonModule, formatDate } from '@angular/common';
import { Component, inject, Input, SimpleChange } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import jsPDF from 'jspdf';
import { finalize } from 'rxjs';
import { ActoAdministrativoDTO } from '../../Models/acto-administrativo-dto';
import { DocSignedDTO } from '../../Models/docsigned.dto';
import { DocumentoGeneradoDTO } from '../../Models/documentos-generados-dto';
import { PindustLineaAyudaDTO } from '../../Models/linea-ayuda-dto';
import { CreateSignatureRequest, SignatureResponse } from '../../Models/signature.dto';
import { ActoAdministrativoService } from '../../Services/acto-administrativo.service';
import { CommonService } from '../../Services/common.service';
import { DocumentosGeneradosService } from '../../Services/documentos-generados.service';
import { ExpedienteService } from '../../Services/expediente.service';
import { PindustLineaAyudaService } from '../../Services/linea-ayuda.service';
import { ViafirmaService } from '../../Services/viafirma.service';
import { DialogKickOffComponent } from '../dialogs/kick-off/kick-off.component';

@Component({
  selector: 'app-acta-de-kick-off',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule, MatInputModule, MatButtonModule, MatExpansionModule, TranslateModule],
  templateUrl: './acta-de-kick-off.component.html',
  styleUrl: './acta-de-kick-off.component.scss'
})
export class ActaDeKickOffComponent {
  private expedienteService = inject(ExpedienteService);
  actoAdmin19: boolean = false;
  signedBy: string = "";
  timeStampDocGenerado: string = "";
  userLoginEmail: string = "";
  ceoEmail: string = "jldejesus@adrbalears.caib.es";
  signatureDocState: string = "";
  nifDocGenerado: string = ""
  nameDocGenerado: string = ""

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
  sendedDateToSign: Date | null = null;
  pdfUrl: SafeResourceUrl | null = null;
  imageUrl: SafeUrl | undefined;
  showPdfViewer: boolean = false
  showImageViewer: boolean = false
  loading: boolean = false;
  response?: SignatureResponse;
  error?: string;
  lineDetail: PindustLineaAyudaDTO[] = [];
  codigoSIA: string = "";
  faltanCampos!: boolean;
  camposVacios: string[] = [];

  get stateClass(): string {
    const map: Record<string, string> = {
      NOT_STARTED: 'req-state--not-started',
      IN_PROCESS: 'req-state--in-process',
      COMPLETED: 'req-state--completed',
      REJECTED: 'req-state--rejected',
    };
    return map[this.signatureDocState ?? ''] ?? 'req-state--not-started';
  }

  @Input() actualID!: number;
  @Input() actualIdExp!: number;
  @Input() actualNif: string = "";
  @Input() actualConvocatoria!: number;
  @Input() actualTipoTramite!: string;
  @Input() actualEmpresa: string = "";
  @Input() form!: FormGroup;

  constructor(
    private commonService: CommonService, private sanitizer: DomSanitizer,
    private viafirmaService: ViafirmaService, private lineaAyuda: PindustLineaAyudaService,
    private documentosGeneradosService: DocumentosGeneradosService, private actoAdminService: ActoAdministrativoService,
    private dialog: MatDialog
  ) {
    this.userLoginEmail = sessionStorage.getItem('tramits_user_email') || "";
  }

  ngOnInit(): void {
    this.actoAdminService.getByNameAndTipoTramite('19_acta_kick_off', 'XECS')
      .subscribe((docDataString: ActoAdministrativoDTO) => {
        this.signedBy = docDataString.signedBy;
      })
  }

  ngOnChanges(changes: SimpleChange): void {
    if (this.tieneTodosLosValores()) {
      this.getActoAdminDetail();
      this.getLineDetail(this.actualConvocatoria);
    }
  }

  getActoAdminDetail(): void {
    this.documentosGeneradosService.getDocumentosGenerados(this.actualID, this.actualNif, this.actualConvocatoria, 'doc_acta_kick_off')
      .subscribe({
        next: (docActoAdmin: DocumentoGeneradoDTO[]) => {
          this.actoAdmin19 = false;
          if (docActoAdmin.length === 1) {
            this.actoAdmin19 = true;
            this.nifDocGenerado = docActoAdmin[0].cifnif_propietario;
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
          this.actoAdmin19 = false;
        }
      })
  }

  checkRequiredFields(): void {
    this.camposVacios = [];
    this.faltanCampos = false;
    const fecha_kick_off = this.form.get('fecha_kick_off')?.value;

    if (!fecha_kick_off?.trim() || fecha_kick_off?.trim() === "0000-00-00") {
      this.camposVacios.push('FORM.fecha_kick_off');
    }
    this.faltanCampos = this.camposVacios.length > 0;

    if (!this.faltanCampos) {
      this.openActaKickOffForm();
    }
  }

  openActaKickOffForm(): void {
    const dialogRef = this.dialog.open(DialogKickOffComponent, {
      width: '80vw',
      height: '60vh',
      data: { idExpediente: this.actualID }
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado?.guardado) {
        this.generateActoAdmin('19_acta_kick_off', 'XECS', 'acta_kick_off', resultado.datosFormulario)
      }
    })
  }
  generateActoAdmin(actoAdministrativoName: string, tipoTramite: string, docFieldToUpdate: string, extraData: any): void {
    const timeStamp = this.commonService.generateCustomTimestamp();
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      floatPrecision: 16
    })

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
    const pageWidth = doc.internal.pageSize.getWidth();

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
        const formattedFecha_kick_off = formatDate(extraData.fecha_kick_off, 'dd/MM/yyyy', 'es-ES');
        const formattedFecha_HastaRealizacionPlan = formatDate(extraData.fecha_kick_off, 'dd/MM/yyyy', 'es-ES');

        /* Lista asistentes */
        const asistentesList = extraData.asistentesKickOff
          .split('\n')
          .map((a: any) => a.trim())
          .filter((a: any) => a.length > 0);

        rawTexto = rawTexto.replace(/%fecha_kick_off%/g, formattedFecha_kick_off);
        rawTexto = rawTexto.replace(/%horaInicioSesionKickOff%/g, extraData.horaInicioSesionKickOff);
        rawTexto = rawTexto.replace(/%horaFinSesionKickOff%/g, extraData.horaFinSesionKickOff);
        rawTexto = rawTexto.replace(/%SOLICITANTE%/g, this.actualEmpresa);
        rawTexto = rawTexto.replace(/%nombreAsistentes%/g, asistentesList);
        rawTexto = rawTexto.replace(/%TUTORKICKOFF%/g, extraData.tutorKickOff);
        rawTexto = rawTexto.replace(/%NUMMESES%/g, extraData.plazosRealizacionPlan);
        rawTexto = rawTexto.replace(/%FECHACIERRE%/g, formattedFecha_HastaRealizacionPlan);
        rawTexto = rawTexto.replace(/%TEXTOLIBRE%/g, extraData.observacionesKickOff);

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
        doc.text(doc.splitTextToSize("Document: acta de kick off", maxTextWidth), x, 45);
        doc.text(`Núm. Expedient: ${this.actualIdExp}/${this.actualConvocatoria}`, x, 48);
        doc.text(`Programa: ${this.actualTipoTramite}`, x, 51);

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
          doc.text(`NIF: ${this.actualNif}`, x, 57);
          doc.text("Emissor (DIR3): A04003714", x, 60);
          doc.text(`Codi SIA: ${this.codigoSIA}`, x, 63);
        }

        doc.setFontSize(10);
        doc.text(doc.splitTextToSize(jsonObject.identificacion, maxTextWidth), marginLeft, 80);
        doc.setFont('helvetica', 'normal');
        doc.text(doc.splitTextToSize(jsonObject.datos_reunion, maxTextWidth), marginLeft, 84);
        const asistentes = jsonObject.Asistentes.split('\n')[1].split(',');
        doc.text(jsonObject.Asistentes.split('\n')[0], marginLeft, 104)

        let afterAsistentesY = 108;
        const lineHeight = 4;
        asistentes.forEach((asistente: any) => {
          doc.text(asistente, marginLeft + 5, afterAsistentesY);
          afterAsistentesY += lineHeight
        })

        doc.setFont('helvetica', 'bold')
        doc.text(jsonObject.Desarrollo, marginLeft, afterAsistentesY + 10);
        doc.setFont('helvetica', 'normal')
        doc.text(doc.splitTextToSize(jsonObject.p1, maxTextWidth), marginLeft, afterAsistentesY + 15);
        doc.text(doc.splitTextToSize(jsonObject.p2, maxTextWidth), marginLeft, afterAsistentesY + 25);
        doc.text(doc.splitTextToSize(jsonObject.p3, maxTextWidth), marginLeft, afterAsistentesY + 35);
        doc.text(doc.splitTextToSize(jsonObject.p4, maxTextWidth), marginLeft, afterAsistentesY + 53);

        doc.text(jsonObject.firma, marginLeft, 220);

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

            this.documentosGeneradosService.deleteByIdSolNifConvoTipoDoc(this.actualID, this.actualNif, this.actualConvocatoria, 'doc_acta_kick_off')
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

  private tieneTodosLosValores(): boolean {
    return (
      this.actualID != null &&
      this.actualIdExp != null &&
      !!this.actualNif &&
      this.actualConvocatoria != null &&
      !!this.actualTipoTramite
    );
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
                this.actoAdmin19 = true;
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
    })
  }

  viewActoAdmin(nif: string, folder: string, filename: string, extension: string) {
    const entorno = sessionStorage.getItem("entorno")
    filename = filename.replace(/^doc_/, "")
    filename = `${this.actualIdExp + '_' + this.actualConvocatoria + '_' + filename}`
    let url = ""
    if (entorno === 'tramits') {
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

  closeViewActoAdmin() {
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
      })
  }

  getSignState(publicAccessId: string) {
    this.viafirmaService.getDocumentStatus(publicAccessId)
      .subscribe((resp: DocSignedDTO) => {
        this.signatureDocState = resp.status
        this.externalSignUrl = resp.addresseeLines[0].addresseeGroups[0].userEntities[0].externalSignUrl
        this.sendedUserToSign = resp.addresseeLines[0].addresseeGroups[0].userEntities[0].userCode
        const sendedDateToSign = resp.creationDate
        this.sendedDateToSign = new Date(sendedDateToSign)
      })
  }

  getLineDetail(convocatoria: number) {
    this.lineaAyuda.getAll().subscribe((lineaAyudaItems: PindustLineaAyudaDTO[]) => {
      this.lineDetail = lineaAyudaItems.filter((item: PindustLineaAyudaDTO) => {
        return item.convocatoria === convocatoria && item.lineaAyuda === "XECS" && item.activeLineData === "SI";
      });
      this.codigoSIA = this.lineDetail[0]['codigoSIA'];
    })
  }

}
