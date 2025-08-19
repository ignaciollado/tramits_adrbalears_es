import { Component, inject, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { DocumentosGeneradosService } from '../../Services/documentos-generados.service';
import { DocumentoGeneradoDTO } from '../../Models/documentos-generados-dto';
import { CommonService } from '../../Services/common.service';
import { ViafirmaService } from '../../Services/viafirma.service';
import { ExpedienteService } from '../../Services/expediente.service';
import { MejorasSolicitudService } from '../../Services/mejoras-solicitud.service';
import { DocSignedDTO } from '../../Models/docsigned.dto';
import { ActoAdministrativoService } from '../../Services/acto-administrativo.service';
import { jsPDF } from 'jspdf';

import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { CreateSignatureRequest, SignatureResponse } from '../../Models/signature.dto';
import { finalize, of, switchMap, tap } from 'rxjs';
import { MejoraSolicitudDTO } from '../../Models/mejoras-solicitud-dto';

@Component({
  selector: 'app-resol-desestimiento-no-enmendar',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, MatExpansionModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './resol-desestimiento-no-enmendar.component.html',
  styleUrl: './resol-desestimiento-no-enmendar.component.scss'
})

export class ResolDesestimientoNoEnmendarComponent {
  private fb = inject(FormBuilder)
  private expedienteService = inject(ExpedienteService)
  actoAdmin2: boolean = false
  sendedToSign: boolean = false
  signatureDocState: string = ""
  nifDocgenerado: string = ""
  timeStampDocGenerado: string = ""
  userLoginEmail: string = ""
  ceoEmail: string = "nachollv@hotmail.com"
  pdfUrl: SafeResourceUrl | null = null
  imageUrl: SafeUrl | undefined
  showPdfViewer: boolean = false
  showImageViewer: boolean = false
  nameDocgenerado: string = ""
  loading: boolean = false;
  response?: SignatureResponse;
  error?: string;

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

  lastInsertId: number | undefined
  publicAccessId: string = ""
  externalSignUrl: string = ""
  sendedUserToSign: string = ""
  sendedDateToSign!: Date

  @Input() signedBy!: string
  @Input() actualID!: number
  @Input() actualIdExp!: number
  @Input() actualNif: string = ""
  @Input() actualConvocatoria!: number
  @Input() actualTipoTramite!: string
  @Input() actualEmpresa: string = ""
  @Input() actualFechaSolicitud: string = ""
  @Input() actualImporteSolicitud: number = 0
  @Input() actualFechaNotifReq: string = ""

  constructor( 
      private commonService: CommonService, private sanitizer: DomSanitizer,
      private viafirmaService: ViafirmaService,
      private documentosGeneradosService: DocumentosGeneradosService, private mejorasSolicitudService: MejorasSolicitudService,
      private actoAdminService: ActoAdministrativoService ) { 
        this.userLoginEmail = sessionStorage.getItem("tramits_user_email") || ""
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

  ngOnChanges(changes: SimpleChanges) {
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
      !!this.actualTipoTramite
    );
  }


  getActoAdminDetail() {
    this.documentosGeneradosService.getDocumentosGenerados(this.actualID, this.actualNif, this.actualConvocatoria, 'doc_res_desestimiento_por_no_enmendar')
      .subscribe({
        next: (docActoAdmin2: DocumentoGeneradoDTO[]) => {
          this.actoAdmin2 = false;
          if (docActoAdmin2.length === 1) {
            this.actoAdmin2 = true;
            this.nifDocgenerado = docActoAdmin2[0].cifnif_propietario
            this.timeStampDocGenerado = docActoAdmin2[0].selloDeTiempo
            this.nameDocgenerado = docActoAdmin2[0].name
            this.lastInsertId = docActoAdmin2[0].id
            this.publicAccessId = docActoAdmin2[0].publicAccessId
            if (this.publicAccessId) {
              this.getSignState(this.publicAccessId)
            }
          }
        },
        error: (err) => {
          console.error('Error obteniendo documentos', err);
          this.actoAdmin2 = false; 
        }
      });
  }

  generateActoAdmin(actoAdministrivoName: string, tipoTramite: string, docFieldToUpdate: string): void {
    // Verifico que existan todos los datos necesarios: %DATANOTREQ%,
    if (this.actualFechaNotifReq === '0000-00-00' || this.actualFechaNotifReq === null) {
      alert ("Falta indicar la fecha Notificació requeriment")
      return
    }
    // Obtengo, desde bbdd, el template json del acto adiministrativo y para la línea: XECS, ADR-ISBA o ILS
    this.actoAdminService.getByNameAndTipoTramite(actoAdministrivoName, tipoTramite).subscribe((docDataString: any) => {
      let hayMejoras = 0
      let rawTexto = docDataString.texto;
      let jsonObject: any; 
      if (!rawTexto) {
        this.commonService.showSnackBar('❌ No se encontró el texto del acto administrativo.');
        return;
      }
    // Voy a crear el Texto que luego servirá para generar el archivo PDF
    // Reemplazo las variables que hay en el template por su valor correspondiente
    rawTexto = docDataString.texto.replace(/%BOIBNUM%/g,"¡¡¡ME FALTA EL BOIB!!!")
    rawTexto = rawTexto.replace(/%NIF%/g, this.actualNif);
    rawTexto = rawTexto.replace(/%SOLICITANTE%/g, this.actualEmpresa);
    rawTexto = rawTexto.replace(/%EXPEDIENTE%/g, String(this.actualIdExp));
    rawTexto = rawTexto.replace(/%CONVO%/g, String(this.actualConvocatoria));
    rawTexto = rawTexto.replace(/%FECHASOL%/g, this.commonService.formatDate(this.actualFechaSolicitud));
    rawTexto = rawTexto.replace(/%IMPORTE%/g, this.commonService.formatCurrency(this.actualImporteSolicitud));
    rawTexto = rawTexto.replace(/%PROGRAMA%/g, this.actualTipoTramite);
    rawTexto = rawTexto.replace(/%DATANOTREQ%/g, this.commonService.formatDate(this.actualFechaNotifReq));
    // Averiguo si hay mejoras en la solicitud
      this.mejorasSolicitudService.countMejorasSolicitud(this.actualID)
      .pipe(
        switchMap((nMejoras: any) => {
        if (nMejoras.total_mejoras > 0) {
          hayMejoras = nMejoras.total_mejoras;
          return this.mejorasSolicitudService.obtenerUltimaMejoraSolicitud(this.actualID).pipe(
            tap((ultimaMejora: MejoraSolicitudDTO) => {
              rawTexto = rawTexto.replace(/%FECHARECM%/g, this.commonService.formatDate(String(ultimaMejora.fecha_rec_mejora)))
              rawTexto = rawTexto.replace(/%NUMRECM%/g, String(ultimaMejora.ref_rec_mejora))
              rawTexto = rawTexto.replace(/%YYY%/g, String("4. "))
              rawTexto = rawTexto.replace(/%ZZZ%/g, String("5. "))
            })
          );
        } else {
          rawTexto = rawTexto.replace(/%YYY%/g, String("3. "))
          rawTexto = rawTexto.replace(/%ZZZ%/g, String("4. "))
          return of(null);
        }
      }),
      tap(() => {
        try {
          jsonObject = JSON.parse(rawTexto);
          this.generarPDF(jsonObject, docFieldToUpdate, hayMejoras);
        } catch (error) {
          console.error('Error al parsear JSON:', error);
        }
      })
    )
    .subscribe();
  })
  }

  generarPDF(jsonObject: any, docFieldToUpdate: string, hayMejoras: number): void {
  const timeStamp = this.commonService.generateCustomTimestamp()
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
    
  const maxCharsPerLine = 21;
  const marginLeft = 25;
  const maxTextWidth = 160;
  const lineHeight = 4;
  const pageHeight = doc.internal.pageSize.getHeight();
  let lines = footerText.split('\n');
  const xHeader = marginLeft + 110
  const yHeader = 54;
    
  lines.reverse().forEach((line, index) => {
    const y = pageHeight - 10 - (index * lineHeight);
    doc.text(line, marginLeft, y);
  });

  doc.setFont('helvetica', 'bold');
  doc.addImage("../../../assets/images/logo-adrbalears-ceae-byn.png", "PNG", 25, 20, 75, 15);
  doc.setFontSize(8);
  doc.text("Document: resolució desistiment", xHeader, 45);
  doc.text(`Núm. Expedient: ${this.actualIdExp}/${this.actualConvocatoria}`, xHeader, 48);
  doc.text(`Programa: ${doc.splitTextToSize(this.actualTipoTramite, maxTextWidth)}`, xHeader, 51);

  if (this.actualEmpresa.length > maxCharsPerLine) {
    const firstLine = this.actualEmpresa.slice(0, maxCharsPerLine);
    const secondLine = this.actualEmpresa.slice(maxCharsPerLine);
    doc.text(`Nom sol·licitant: ${firstLine}`, xHeader, yHeader);
    doc.text(secondLine, xHeader, yHeader + 3);
    doc.text(`NIF: ${this.actualNif}`, xHeader, yHeader + 6);
    doc.text("Emissor (DIR3): A04003714", xHeader, yHeader + 9);
    doc.text("Codi SIA: ", xHeader, yHeader + 12);
  } else {
    doc.text(`Nom sol·licitant: ${this.actualEmpresa}`, xHeader, yHeader);
    doc.text(`NIF: ${this.actualNif}`, xHeader, 57);
    doc.text("Emissor (DIR3): A04003714", xHeader, 60);
    doc.text("Codi SIA: ", xHeader, 63);
  }

  doc.setFontSize(10);
  doc.text(doc.splitTextToSize(jsonObject.asunto, maxTextWidth), marginLeft, 90);
  doc.setFont('helvetica', 'bold');
  doc.text(doc.splitTextToSize(jsonObject.antecedentes_tit, maxTextWidth), marginLeft, 115);
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(jsonObject.antecedentes_1_2, maxTextWidth), marginLeft + 5, 130);

  if (hayMejoras > 0) {
    doc.text(doc.splitTextToSize(jsonObject.antecedentes_3_m, maxTextWidth), marginLeft + 5, 170);
    doc.text(doc.splitTextToSize(jsonObject.antecedentes_4_5, maxTextWidth), marginLeft + 5, 182);
  } else {
    doc.text(doc.splitTextToSize(jsonObject.antecedentes_4_5, maxTextWidth), marginLeft + 5, 170);
  }

  // Salto de página
  doc.addPage();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.addImage("../../../assets/images/logoVertical.png", "PNG", 25, 20, 18, 20);
  lines = footerText.split('\n');
  lines.reverse().forEach((line, index) => {
    const y = pageHeight - 10 - (index * lineHeight);
    doc.text(line, marginLeft, y);
  });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(doc.splitTextToSize(jsonObject.fundamentosDeDerecho_tit, maxTextWidth), marginLeft, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(jsonObject.fundamentosDeDerechoTxt, maxTextWidth), marginLeft, 70);
  
  // Salto de página
  doc.addPage();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.addImage("../../../assets/images/logoVertical.png", "PNG", 25, 20, 18, 20);
  lines = footerText.split('\n');
  lines.reverse().forEach((line, index) => {
    const y = pageHeight - 10 - (index * lineHeight);
    doc.text(line, marginLeft, y);
  });

  doc.setFontSize(10);
  doc.text(doc.splitTextToSize(jsonObject.dicto, maxTextWidth), marginLeft, 60);
  doc.setFont('helvetica', 'bold');
  doc.text(doc.splitTextToSize(jsonObject.resolucion_tit, maxTextWidth), marginLeft, 70);
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(jsonObject.resolucion, maxTextWidth), marginLeft, 75);
  doc.setFont('helvetica', 'bold');
  doc.text(doc.splitTextToSize(jsonObject.recursos_tit, maxTextWidth), marginLeft, 100);
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(jsonObject.recursos, maxTextWidth), marginLeft, 110);
  doc.text(doc.splitTextToSize(jsonObject.firma, maxTextWidth), marginLeft, 210);

  // además de generar el pdf del acto administrativo hay que enviarlo al backend
  // Convertir a Blob
  const pdfBlob = doc.output('blob');

  // Crear FormData
  const formData = new FormData();
  const fileName = `${this.actualIdExp + '_' + this.actualConvocatoria+'_'+docFieldToUpdate}.pdf`;
  formData.append('file', pdfBlob, fileName);
  formData.append('id_sol', String(this.actualID));
  formData.append('convocatoria', String(this.actualConvocatoria));
  formData.append('nifcif_propietario', String(this.actualNif));
  formData.append('timeStamp', String(timeStamp));

  // Enviar al backend usando el servicio
  this.actoAdminService.sendPDFToBackEnd(formData).subscribe({
    next: (response) => {
      // ToDo: al haberse generado con éxito, ahora hay que:
      // Hacer un INSERT en la tabla pindust_documentos_generados y recoger el id asignado al registro creado: 'last_insert_id'. 
      // y antes eliminar los documentos generados para evitar duplicados.
      this.docGeneradoInsert.id_sol = this.actualID
      this.docGeneradoInsert.cifnif_propietario = this.actualNif
      this.docGeneradoInsert.convocatoria = String(this.actualConvocatoria)
      this.docGeneradoInsert.name = `doc_${docFieldToUpdate}.pdf`
      this.docGeneradoInsert.type = 'application/pdf'
      this.docGeneradoInsert.created_at = response.path
      this.docGeneradoInsert.tipo_tramite = this.actualTipoTramite
      this.docGeneradoInsert.corresponde_documento = `doc_${docFieldToUpdate}`
      this.docGeneradoInsert.selloDeTiempo = timeStamp

      this.nameDocgenerado =  `doc_${docFieldToUpdate}.pdf`
      // delete documentos generados antes del insert para evitar duplicados
      this.documentosGeneradosService.deleteByIdSolNifConvoTipoDoc( this.actualID, this.actualNif, this.actualConvocatoria, 'doc_res_desestimiento_por_no_enmendar')
        .subscribe({
          next: () => {
            // Eliminado correctamente, o no había nada que eliminar
            this.InsertDocumentoGenerado(docFieldToUpdate);
          },
          error: (deleteErr) => {
            const status = deleteErr?.status;
            const msg = deleteErr?.error?.message || '';
            // Si es "no encontrado" (por ejemplo, 404) seguimos el flujo normal
            if (status === 404 || msg.includes('no se encontró') || msg.includes('No existe')) {
              this.commonService.showSnackBar('ℹ️ No había documento previo que eliminar.');
              this.InsertDocumentoGenerado(docFieldToUpdate);
            } else {
            // Otros errores sí se notifican y no continúan
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
      });   
  }

  /** Método auxiliar para no repetir el bloque de creación */
  InsertDocumentoGenerado(docFieldToUpdate: string): void {
  this.documentosGeneradosService.create(this.docGeneradoInsert).subscribe({
    next: (resp: any) => {
      this.lastInsertId = resp?.id;
      if (this.lastInsertId) {
        this.expedienteService
          .updateDocFieldExpediente( this.actualID, 'doc_' + docFieldToUpdate, String(this.lastInsertId) )
          .subscribe({
            next: (response: any) => {
              const mensaje =
                response?.message ||
                '✅ Acto administrativo generado y expediente actualizado correctamente.';
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

  viewActoAdmin(nif: string, folder: string, filename: string, extension: string) {
    const entorno = sessionStorage.getItem("entorno")
    filename = filename.replace(/^doc_/, "")
    filename = `${this.actualIdExp+'_'+this.actualConvocatoria+'_'+filename}`
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
    // Limpiar estados previos
    this.error = undefined;
    this.response = undefined;
    this.loading = true;
    filename = filename.replace(/^doc_/, "")
    filename = `${this.actualIdExp+'_'+this.actualConvocatoria+'_'+filename}`
    
    const payload: CreateSignatureRequest = {
      adreca_mail: this.signedBy === 'tecnico'
      ? this.userLoginEmail           // correo del usuario logeado
      : this.ceoEmail,                // correo de coe,
      /* telefono_cont: this.telefono_rep ?? '', */
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
      this.commonService.showSnackBar( id ? `Solicitud de firma creada. ID: ${id} y enviada a la dirección: ${payload.adreca_mail}` : 'Solicitud de firma creada correctamente');
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
    .subscribe((resp:DocSignedDTO) => {
      this.signatureDocState = resp.status
      this.externalSignUrl = resp.addresseeLines[0].addresseeGroups[0].userEntities[0].externalSignUrl
      this.sendedUserToSign =  resp.addresseeLines[0].addresseeGroups[0].userEntities[0].userCode
      const sendedDateToSign = resp.creationDate
      this.sendedDateToSign = new Date(sendedDateToSign)
    })
  }
}
