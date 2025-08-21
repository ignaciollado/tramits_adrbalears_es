import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
  selector: 'app-requerimiento-adr-isba',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, MatExpansionModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './requerimiento.component.html',
  styleUrl: './requerimiento.component.scss'
})
export class RequerimientoAdrIsbaComponent implements OnChanges {

  private fb = inject(FormBuilder)
  private expedienteService = inject(ExpedienteService)
  formRequerimiento!: FormGroup;
  noRequestReasonText: boolean = true;

  userLoginEmail: string = "";
  signatureDocState: string = "";
  reqGenerado: boolean = false;
  nifDocgenerado: string = "";
  timeStampDocGenerado: string = "";
  nameDocgenerado: string = "";
  lastInsertId: number | undefined;
  publicAccessId: string = "";
  externalSignUrl: string = "";
  sendedUserToSign: string = "";
  sendedDateToSign!: Date;
  pdfUrl: SafeResourceUrl | null = null;
  imageUrl: SafeUrl | undefined;
  showPdfViewer: boolean = false;
  showImageViewer: boolean = false;
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
  };
  response?: SignatureResponse;
  loading: boolean = false;
  error?: string;
  ceoEmail: string = "jldejesus@adrbalears.caib.es";
  signedBy!: string;

  @Input() actualID!: number;
  @Input() actualIdExp!: number;
  @Input() actualNif!: string;
  @Input() actualConvocatoria!: number;
  @Input() actualTipoTramite!: string;
  @Input() actualEmpresa!: string;
  @Input() motivoRequerimiento!: string;

  constructor(
    private commonService: CommonService, private sanitizer: DomSanitizer,
    private viafirmaService: ViafirmaService, private documentosGeneradosService: DocumentosGeneradosService,
    private actoAdminService: ActoAdministrativoService
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

  ngOnChanges(changes: SimpleChanges): void {
    if (this.tieneTodosLosValores()) {
      this.getActoAdminDetail();
    }

    if (this.formRequerimiento && this.motivoRequerimiento) {
      this.formRequerimiento.get('motivoRequerimiento')
        ?.setValue(this.motivoRequerimiento)
    }
  }

  private tieneTodosLosValores(): boolean {
    return (
      this.actualID != null &&
      this.actualIdExp != null &&
      !!this.actualNif && this.actualConvocatoria != null &&
      !!this.actualTipoTramite
    );
  }

  ngOnInit(): void {
    this.formRequerimiento = this.fb.group({
      motivoRequerimiento: [{ value: '', disabled: false }]
    });

    this.actoAdminService.getByNameAndTipoTramite('isba_1_requerimiento', 'ADR-ISBA').subscribe((docDataString: ActoAdministrativoDTO) => {
      this.signedBy = docDataString.signedBy;
    })
  }

  getActoAdminDetail() {
    this.documentosGeneradosService.getDocumentosGenerados(this.actualID, this.actualNif, this.actualConvocatoria, 'doc_requeriment')
      .subscribe({
        next: (docGenerado: DocumentoGeneradoDTO[]) => {
          if (docGenerado.length === 1) {
            this.reqGenerado = true;
            this.nifDocgenerado = docGenerado[0].cifnif_propietario;
            this.timeStampDocGenerado = docGenerado[0].selloDeTiempo;
            this.nameDocgenerado = docGenerado[0].name;
            this.lastInsertId = docGenerado[0].id;
            this.publicAccessId = docGenerado[0].publicAccessId;

            if (this.publicAccessId) {
              this.viewSignState(this.publicAccessId)
            }
          }
        },
        error: (err) => {
          console.error('Error obteniendo documentos', err);
          this.reqGenerado = false;
        }
      })
  }

  saveReasonRequest(): void {
    const motivo = this.formRequerimiento.get('motivoRequerimiento')?.value;
    this.expedienteService.updateDocFieldExpediente(this.actualID, 'motivoRequerimiento', motivo).subscribe();
    this.noRequestReasonText = false;
    this.reqGenerado = false;
  }

  generateActoAdmin(actoAdministrativoName: string, tipoTramite: string, docFieldToUpdate: string): void {
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
    })

    const footerText = 'Plaça de Son Castelló, 1\n07009 Polígon de Son Castelló - Palma\nTel. 971 17 61 61\nwww.adrbalears.es';
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8)


    const marginLeft = 25;
    const maxTextWidth = 160;
    const lineHeight = 4;
    const pageHeight = doc.internal.pageSize.getHeight();
    const lines = footerText.split('\n');

    const x = marginLeft + 110;
    const y = 51;
    const maxCharsPerLine = 21;

    lines.reverse().forEach((line, index) => {
      const y = pageHeight - 10 - (index * lineHeight);
      doc.text(line, marginLeft, y);
    })

    this.actoAdminService.getByNameAndTipoTramite(actoAdministrativoName, tipoTramite)
      .subscribe((docDataString: ActoAdministrativoDTO) => {
        let rawTexto = docDataString.texto;
        this.signedBy = docDataString.signedBy;

        let jsonObject;
        // Limpieza de texto
        try {
          rawTexto = this.commonService.cleanRawText(rawTexto);
        } catch (error) {
          console.error('Error al parsear JSON: ', error);
        } finally {
          jsonObject = JSON.parse(rawTexto);
        }

        doc.addImage('../../../assets/images/logo-adrbalears-ceae-byn.png', 'PNG', 25, 20, 75, 15);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text("Document: requeriment", marginLeft + 110, 45);
        doc.text(`Núm. Expedient: ${this.actualIdExp}/${this.actualConvocatoria}`, marginLeft + 110, 48);
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
        doc.text(doc.splitTextToSize(jsonObject.asunto, maxTextWidth), marginLeft, 90);
        doc.setFont('helvetica', 'normal');
        doc.text(doc.splitTextToSize(jsonObject.p1, maxTextWidth), marginLeft, 100);
        doc.text(doc.splitTextToSize(`    • ${this.formRequerimiento.get('motivoRequerimiento')?.value}`, maxTextWidth), marginLeft, 130);
        doc.text(doc.splitTextToSize(jsonObject.p2, maxTextWidth), marginLeft, 140);
        doc.text(doc.splitTextToSize(jsonObject.p3, maxTextWidth), marginLeft, 155);
        doc.text(doc.splitTextToSize(jsonObject.firma, maxTextWidth), marginLeft, 220);
        doc.text(doc.splitTextToSize('Palma, en fecha de la firma electrónica', maxTextWidth), marginLeft, 225);

        const pdfBlob = doc.output('blob');

        // Crear FormData
        const formData = new FormData();
        const fileName = `${this.actualIdExp}_${this.actualConvocatoria}_${docFieldToUpdate}.pdf`;
        formData.append('file', pdfBlob, fileName);
        formData.append('id_sol', String(this.actualID));
        formData.append('convocatoria', String(this.actualConvocatoria));
        formData.append('nifcif_propietario', String(this.actualNif))
        formData.append('timeStamp', String(timeStamp));

        // Enviar al backend usando el servicio
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

            this.nameDocgenerado = `doc_${docFieldToUpdate}.pdf`;

            this.documentosGeneradosService.deleteByIdSolNifConvoTipoDoc(this.actualID, this.actualNif, this.actualConvocatoria, 'doc_requeriment')
              .subscribe({
                next: () => {
                  console.log('Eliminado correctamente, o no había nada que eliminar');
                  this.crearDocumentoGenerado(docFieldToUpdate);
                },
                error: (deleteErr) => {
                  const status = deleteErr?.status;
                  const msg = deleteErr?.error?.message || '';
                  if (status === 404 || msg.includes('no se encontró') || msg.includes('No existe')) {
                    this.commonService.showSnackBar('ℹ️ No había documento previo que eliminar.');
                    this.crearDocumentoGenerado(docFieldToUpdate);
                  } else {
                    // Otros errores si se notifican y no continúan
                    const deleteErrMsg = msg || '❌ Error al eliminar el documento previo.';
                    this.commonService.showSnackBar(deleteErrMsg);
                  }
                }
              });
          },
          error: (err) => {
            const errorMsg = err?.error?.message || '❌ Error al guardar el Acto administrativo.';
            this.commonService.showSnackBar(errorMsg);
          }
        })
      })
  }

  crearDocumentoGenerado(docFieldToUpdate: string): void {
    this.documentosGeneradosService.create(this.docGeneradoInsert).subscribe({
      next: (resp: any) => {
        this.lastInsertId = resp?.id;
        if (this.lastInsertId) {
          this.expedienteService
            .updateDocFieldExpediente(this.actualID, 'doc_' + docFieldToUpdate, String(this.lastInsertId))
            .subscribe({
              next: (response: any) => {
                const mensaje = response?.message || '✅ Acto administrativo generado y expediente actualizado correctamente.';
                this.reqGenerado = true;
                this.commonService.showSnackBar(mensaje);
              },
              error: (updateErr) => {
                const updateErrorMsg = updateErr?.error?.message ||
                  '⚠️ Documento generado, pero error al actualizar el expediente.';
                this.commonService.showSnackBar(updateErrorMsg)
              }
            });
        } else {
          this.commonService.showSnackBar(
            '⚠️ Documento generado, pero no se recibió el ID para actualizar el expediente.'
          );
        }
      },
      error: (insertErr) => {
        const insertErrorMsg = insertErr?.error?.message || '❌ Error al guardar el documento generado.';
        this.commonService.showSnackBar(insertErrorMsg)
      }
    });
  }


  viewActoAdmin(nif: string, folder: string, filename: string, extension: string) {
    const entorno = sessionStorage.getItem('entorno');
    filename = filename.replace(/^doc_/, "");
    filename = `${this.actualIdExp + '_' + this.actualConvocatoria + '_' + filename}`;
    let url = "";

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
    // Limpiar estados previos
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
          this.viewSignState(this.publicAccessId);
        },
        error: (err) => {
          const msg = err?.error?.message || err?.message || 'No se pudo enviar la solicitud de firma';
          this.error = msg;
          this.commonService.showSnackBar(msg);
        }
      })
  }

  viewSignState(publicAccessId: string) {
    this.viafirmaService.getDocumentStatus(publicAccessId)
      .subscribe((resp: DocSignedDTO) => {
        this.signatureDocState = resp.status;
        this.externalSignUrl = resp.addresseeLines[0].addresseeGroups[0].userEntities[0].externalSignUrl;
        this.sendedUserToSign = resp.addresseeLines[0].addresseeGroups[0].userEntities[0].userCode;
        const sendedDateToSign = resp.creationDate;
        this.sendedDateToSign = new Date(sendedDateToSign)
      })
  }
}
