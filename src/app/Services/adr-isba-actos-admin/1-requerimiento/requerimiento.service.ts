import { inject, Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import jsPDF from 'jspdf';
import { BehaviorSubject, finalize, switchMap, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ActoAdministrativoDTO } from '../../../Models/acto-administrativo-dto';
import { ConfigurationModelDTO } from '../../../Models/configuration.dto';
import { DocSignedDTO } from '../../../Models/docsigned.dto';
import { DocumentoGeneradoDTO } from '../../../Models/documentos-generados-dto';
import { PindustLineaAyudaDTO } from '../../../Models/linea-ayuda-dto';
import { CreateSignatureRequest } from '../../../Models/signature.dto';
import { ActoAdministrativoService } from '../../acto-administrativo.service';
import { CommonService } from '../../common.service';
import { DocumentosGeneradosService } from '../../documentos-generados.service';
import { ExpedienteService } from '../../expediente.service';
import { PindustLineaAyudaService } from '../../linea-ayuda.service';
import { PindustConfiguracionService } from '../../pindust-configuracion.service';
import { ViafirmaService } from '../../viafirma.service';

@Injectable({
  providedIn: 'root'
})
export class RequerimientoAdrIsbaService {
  private expedienteService = inject(ExpedienteService);

  expediente!: any;

  // Propiedades del expediente
  actualID!: number;
  actualIdExp!: number;
  actualConvocatoria!: number;
  actualEmpresa!: string;
  actualNif!: string;
  actualTipoTramite!: string;

  // Propiedades para el documento
  codigoSIA!: string;

  // Necesario para la subida al backend
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

  // Datos del acto
  docDataString!: ActoAdministrativoDTO;
  signedBy!: string;

  // Correos
  technicianEmail!: string;
  ceoEmail!: string;
  consellerEmail!: string;

  // Formulario de detalle para interactuar con sus datos. Se le pasará desde el componente padre
  form!: FormGroup;

  // Subjects para el componente padre. Estos son propiedades que se utilizan en la template del acto

  // actoAdmin
  private actoAdminSubject = new BehaviorSubject<boolean>(false);
  actoAdmin$ = this.actoAdminSubject.asObservable();

  // noRequestReasonText
  private noRequestReasonTextSubject = new BehaviorSubject<boolean>(true);
  noRequestReasonText$ = this.noRequestReasonTextSubject.asObservable();

  // publicAccessId
  private publicAccessIdSubject = new BehaviorSubject<string>('');
  publicAccessId$ = this.publicAccessIdSubject.asObservable();

  // signatureDocState
  private signatureDocStateSubject = new BehaviorSubject<string>('');
  signatureDocState$ = this.signatureDocStateSubject.asObservable();

  // externalSignUrl
  private externalSignUrlSubject = new BehaviorSubject<string>('');
  externalSignUrl$ = this.externalSignUrlSubject.asObservable();

  // sendedUserToSign
  private sendedUserToSignSubject = new BehaviorSubject<string>('');
  sendedUserToSign$ = this.sendedUserToSignSubject.asObservable();

  // sendedDateToSign
  private sendedDateToSignSubject = new BehaviorSubject<any>(null);
  sendedDateToSign$ = this.sendedDateToSignSubject.asObservable();

  // pdfUrl
  private pdfUrlSubject = new BehaviorSubject<SafeResourceUrl | null>(null);
  pdfUrl$ = this.pdfUrlSubject.asObservable();

  // showPdfViewer
  private showPdfViewerSubject = new BehaviorSubject<boolean>(false);
  showPdfViewer$ = this.showPdfViewerSubject.asObservable();

  // Propiedades de subject para el servicio duplicados si estos se usan en alguna lógica del servicio
  publicAccessId!: string;
  signatureDocState!: string;

  pdfUrl!: SafeResourceUrl | null;
  showPdfViewer!: boolean;

  // Datos de un acto previamente generado
  nifDocGenerado!: string;
  timeStampDocGenerado!: string;
  nameDocGenerado!: string;
  lastInsertId!: number | undefined;

  constructor(
    private commonService: CommonService,
    private viafirmaService: ViafirmaService,
    private documentosGeneradosService: DocumentosGeneradosService,
    private actoAdminService: ActoAdministrativoService,
    private lineaAyuda: PindustLineaAyudaService,
    private configGlobal: PindustConfiguracionService,
    private sanitizer: DomSanitizer
  ) {
    this.technicianEmail = sessionStorage.getItem("tramits_user_email") || "";
  }

  // Inicialización del servicio. Se realiza con el onChanges para que pueda pasarse correctamente el expediente y el formulario.
  init(expediente: any, form: any) {
    this.resetSubjects();
    if (form) {
      this.form = form;
    }
    if (expediente) {
      this.bindData(expediente);

      this.configGlobal.getActive().pipe(
        tap((globalConfig: ConfigurationModelDTO[]) => {
          if (globalConfig.length > 0) {
            /* Quitar hardcodeo de emails */
            // this.ceoEmail = globalConfig[0].eMailDGerente;
            // this.consellerEmail = globalConfig[0].eMailPresidente;

            this.ceoEmail = "jose.luis@idi.es";
            this.consellerEmail = "jldejesus@adrbalears.caib.es"
          }
        }),
        switchMap(() => this.lineaAyuda.getAll()),
        tap((lineaAyudaItems: PindustLineaAyudaDTO[]) => {
          const lineDetail = lineaAyudaItems.filter((item) =>
            item.convocatoria === this.actualConvocatoria &&
            item.lineaAyuda === "ADR-ISBA" &&
            item.activeLineData === "SI"
          );
          if (lineDetail.length > 0) {
            this.codigoSIA = lineDetail[0]['codigoSIA'];
          }
        }),
        switchMap(() => this.actoAdminService.getByNameAndTipoTramite('isba_1_requerimiento', 'ADR-ISBA'))
      ).subscribe({
        next: (docDataString: ActoAdministrativoDTO) => {
          this.docDataString = docDataString;
          this.signedBy = this.docDataString.signedBy;
          this.getActoAdminDetail(); // Carga de expediente previamente generado
        },
        error: (err) => console.error('Error inicializando requerimiento', err)
      })

    }
  }

  // Vinculación de datos necesarios para todo el servicio. Este no es público
  private bindData(expediente: any) {
    this.expediente = expediente;

    this.actualID = this.expediente.id;
    this.actualIdExp = this.expediente.idExp;
    this.actualEmpresa = this.expediente.empresa;
    this.actualConvocatoria = this.expediente.convocatoria;
    this.actualNif = this.expediente.nif;
    this.actualTipoTramite = this.expediente.tipo_tramite;
  }

  // Cargado de documento ya generado
  getActoAdminDetail(): void {
    this.documentosGeneradosService.getDocumentosGenerados(this.actualID, this.actualNif, this.actualConvocatoria, 'doc_requeriment_adr_isba')
      .subscribe({
        next: (docGenerado: DocumentoGeneradoDTO[]) => {
          if (docGenerado.length === 1) {
            this.actoAdminSubject.next(true);
            this.nifDocGenerado = docGenerado[0].cifnif_propietario;
            this.timeStampDocGenerado = docGenerado[0].selloDeTiempo;
            this.nameDocGenerado = docGenerado[0].name;
            this.lastInsertId = docGenerado[0].id;
            this.publicAccessIdSubject.next(docGenerado[0].publicAccessId)
            this.publicAccessId = docGenerado[0].publicAccessId;

            if (this.publicAccessId$) {
              this.viewSignState(this.publicAccessId);
            }
          }
        },
        error: (err) => {
          console.error('Error obteniendo documento generado', err);
          this.actoAdminSubject.next(false);
        }
      })
  }

  // Visualización estado de firma
  viewSignState(publicAccessId: string) {
    this.viafirmaService.getDocumentStatus(publicAccessId)
      .subscribe((resp: DocSignedDTO) => {
        this.signatureDocStateSubject.next(resp.status);
        this.signatureDocState = resp.status;

        this.externalSignUrlSubject.next(resp.addresseeLines[0].addresseeGroups[0].userEntities[0].externalSignUrl);
        this.sendedUserToSignSubject.next(resp.addresseeLines[0].addresseeGroups[0].userEntities[0].userCode);
        const sendedDateToSign = resp.creationDate;
        this.sendedDateToSignSubject.next(sendedDateToSign);

        // Actualización si está firmado y si la fecha de requerimiento no es igual a la fecha previamente guardada
        if (this.signatureDocState === "COMPLETED") {
          if (this.form.get('fecha_requerimiento')?.value.split(" ")[0] !== this.commonService.convertUnixToHumanDate(resp.endDate, true)) {
            // Actualización expediente.
            this.expedienteService.updateFieldExpediente(this.actualID, 'fecha_requerimiento', this.commonService.convertUnixToHumanDate(resp.endDate, true))
              .subscribe({
                next: () => {
                  this.commonService.showSnackBar('✅ Fecha requerimiento actualizada correctamente')
                  this.expedienteService.updateFieldExpediente(this.actualID, 'situacion', 'firmadoReq').subscribe({
                    next: () => {
                      this.commonService.showSnackBar('✅ Situación de expediente actualizada correctamente')
                      this.form.patchValue(
                        {
                          fecha_requerimiento: this.commonService.convertUnixToHumanDate(resp.endDate, true),
                          situacion: 'firmadoReq'
                        }
                      );
                    },
                    error: () => {
                      this.commonService.showSnackBar('⚠️ No se ha podido actualizar la situación del expediente')
                    }
                  })
                },
                error: () => {
                  this.commonService.showSnackBar('⚠️ No se ha podido actualizar la fecha de requerimiento')
                }
              });
          }
        }
      })
  }

  // Visualización acto
  viewActoAdmin(): void {
    const entorno = environment.apiUrl;
    let filename = this.nameDocGenerado.replace(/^doc_/, "");
    filename = `${this.actualIdExp}_${this.actualConvocatoria}_${filename}`;
    const url = `${entorno}/documents/view/${this.actualNif}/informes/${filename}`;

    const sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);

    this.pdfUrlSubject.next(sanitizedUrl);
    this.showPdfViewerSubject.next(true);
  }

  // Cierre visualización acto
  closeViewActoAdmin() {
    this.pdfUrlSubject.next(null);
    this.showPdfViewerSubject.next(false);
  }

  // Envío a firma
  sendActoAdminToSign(): void {
    const nif = this.actualNif;
    const filename = `${this.actualIdExp}_${this.actualConvocatoria}_requeriment_adr_isba.pdf`;

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
    }

    this.viafirmaService.createSignatureRequest(payload)
      .pipe(finalize(() => { }))
      .subscribe({
        next: (res) => {
          const id = res?.publicAccessId;
          this.publicAccessIdSubject.next(id ?? '');
          this.publicAccessId = id ?? '';
          this.commonService.showSnackBar(id ? `Solicitud de firma creada. ID: ${id} y enviada a la dirección: ${payload.adreca_mail}` : 'Solicitud de firma creada correctamente');
          this.viewSignState(this.publicAccessId);

        },
        error: (err) => {
          const msg = err?.error?.message || err?.message || 'No se pudo enviar la solicitud de firma';
          this.commonService.showSnackBar(msg);
        }
      })
  }

  // Guardado de motivo
  saveReasonRequest(formRequerimiento: any): void {
    const motivo = formRequerimiento.get('motivoRequerimiento')?.value;
    if (formRequerimiento.valid) {
      this.expedienteService.updateFieldExpediente(this.actualID, 'motivoRequerimiento', motivo).subscribe()
      this.noRequestReasonTextSubject.next(false);
      this.actoAdminSubject.next(false);

      // Borrado automático de documento si cambia el motivo
      this.documentosGeneradosService.deleteByIdSolNifConvoTipoDoc(this.actualID, this.actualNif, this.actualConvocatoria, 'doc_requeriment_adr_isba').subscribe({
        error: () => { } // Evito que salte el error si ya se ha actualizado el motivo de requerimiento 2 veces seguidas
      });

      // Actualización de situación de expediente
      this.expedienteService.updateFieldExpediente(this.actualID, 'situacion', 'emitirReq').subscribe({
        next: () => {
          this.form.patchValue({ situacion: 'emitirReq' });
          this.commonService.showSnackBar('✅ Situación de expediente actualizada correctamente')
        },
        error: () => {
          this.commonService.showSnackBar('⚠️ No se ha podido actualizar la situación del expediente')
        }
      })
    }
  }

  // Generador acto administrativo
  generateActoAdmin(): void {
    const docFieldToUpdate: string = 'requeriment_adr_isba'

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
    const pageWidth = doc.internal.pageSize.getWidth();

    lines.reverse().forEach((line, index) => {
      const y = pageHeight - 10 - (index * lineHeight);
      doc.text(line, marginLeft, y);
    })

    let rawTexto = this.docDataString.texto;
    this.signedBy = this.docDataString.signedBy;

    if (!rawTexto) {
      this.commonService.showSnackBar('❌ No se encontró el texto del acto administrativo.');
      return;
    }

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
    doc.text(doc.splitTextToSize(jsonObject.asunto, maxTextWidth), marginLeft, 90);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(jsonObject.p1, maxTextWidth), marginLeft, 100);
    doc.text(doc.splitTextToSize(`    • ${this.form.get('motivoRequerimiento')?.value}`, maxTextWidth), marginLeft, 130);
    doc.text(doc.splitTextToSize(jsonObject.p2, maxTextWidth), marginLeft, 140);
    doc.text(doc.splitTextToSize(jsonObject.p3, maxTextWidth), marginLeft, 155);
    doc.text(doc.splitTextToSize(jsonObject.firma, maxTextWidth), marginLeft, 220);

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.text(`${i}/${totalPages}`, pageWidth - 20, pageHeight - 10);
    }


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

        this.nameDocGenerado = `doc_${docFieldToUpdate}.pdf`;

        this.documentosGeneradosService.deleteByIdSolNifConvoTipoDoc(this.actualID, this.actualNif, this.actualConvocatoria, 'doc_requeriment_adr_isba')
          .subscribe({
            next: () => {
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
  }

  // Subir documento a la BBDD
  crearDocumentoGenerado(docFieldToUpdate: string): void {
    this.documentosGeneradosService.create(this.docGeneradoInsert).subscribe({
      next: (resp: any) => {
        this.lastInsertId = resp?.id;
        if (this.lastInsertId) {
          this.expedienteService
            .updateFieldExpediente(this.actualID, `doc_${docFieldToUpdate}`, String(this.lastInsertId))
            .subscribe({
              next: (response: any) => {
                const mensaje = response?.message || '✅ Acto administrativo generado y expediente actualizado correctamente.';
                this.actoAdminSubject.next(true);
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
      }
    })
  }

  private resetSubjects(): void {
    this.actoAdminSubject.next(false);
    this.noRequestReasonTextSubject.next(true);
    this.publicAccessIdSubject.next('');
    this.signatureDocStateSubject.next('');
    this.externalSignUrlSubject.next('');
    this.sendedUserToSignSubject.next('');
    this.sendedDateToSignSubject.next(null);
    this.pdfUrlSubject.next(null);
    this.showPdfViewerSubject.next(false);
  }
}

