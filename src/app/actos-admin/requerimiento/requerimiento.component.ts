import { Component, inject, Input, OnChanges, SimpleChanges} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DocumentComponent } from '../../document/document.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { DocumentosGeneradosService } from '../../Services/documentos-generados.service';
import { DocumentoGeneradoDTO } from '../../Models/documentos-generados-dto';
import { CommonService } from '../../Services/common.service';
import { ViafirmaService } from '../../Services/viafirma.service';
import { ExpedienteService } from '../../Services/expediente.service';
import { DocSignedDTO } from '../../Models/docsigned.dto';
import { ActoAdministrativoService } from '../../Services/acto-administrativo.service';
import { jsPDF } from 'jspdf';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { CreateSignatureRequest, SignatureResponse } from '../../Models/signature.dto';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-requerimiento',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, MatExpansionModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './requerimiento.component.html',
  styleUrl: './requerimiento.component.scss'
})
export class RequerimientoComponent implements OnChanges {

  private fb = inject(FormBuilder)
  private expedienteService = inject(ExpedienteService)
  formRequerimiento!: FormGroup
  noRequestReasonText:boolean = true
  reqGenerado: boolean = false
  nifDocgenerado: string = ""
  timeStampDocGenerado: string = ""
  nameDocgenerado: string = ""
  pdfUrl: SafeResourceUrl | null = null
  imageUrl: SafeUrl | undefined
  showPdfViewer: boolean = false
  showImageViewer: boolean = false

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
                    publicAccessId: '-'
  }
  lastInsertId: number | undefined
  loading: boolean = false;
  response?: SignatureResponse;
  error?: string;

  @Input() actualID!: number
  @Input() actualIdExp!: number
  @Input() actualNif!: string
  @Input() actualConvocatoria!: number
  @Input() email_rep!: string | undefined
  @Input() telefono_rep!: string | undefined
  @Input() actualTipoTramite!: string
  @Input() motivoRequerimiento!: string

  constructor(  private commonService: CommonService, private sanitizer: DomSanitizer,
              private viafirmaService: ViafirmaService,
              private documentosGeneradosService: DocumentosGeneradosService,
              private actoAdminService: ActoAdministrativoService ) { }

  ngOnChanges(changes: SimpleChanges) {
    if (this.tieneTodosLosValores()) {
      this.getActoAdminDetail();
    }
    if (this.formRequerimiento && this.motivoRequerimiento) {
    this.formRequerimiento
      .get('motivoRequerimiento')
      ?.setValue(this.motivoRequerimiento);
  }
  }

  private tieneTodosLosValores(): boolean {
    return (
      this.actualID != null &&
      this.actualIdExp != null &&
      !!this.actualNif &&
      this.actualConvocatoria != null &&
      !!this.email_rep &&
      !!this.telefono_rep &&
      !!this.actualTipoTramite 
    );
  }

  ngOnInit(): void {
    this.formRequerimiento = this.fb.group({
      motivoRequerimiento:[{ value: '', disabled: false }],
    })
  }

  getActoAdminDetail() {
    this.documentosGeneradosService.getDocumentosGenerados(this.actualID, this.actualNif, this.actualConvocatoria, 'doc_requeriment')
      .subscribe({
        next: (docGenerado: DocumentoGeneradoDTO[]) => {
          if (docGenerado.length === 1) {
            this.reqGenerado = true;
            this.nifDocgenerado = docGenerado[0].cifnif_propietario
            this.timeStampDocGenerado = docGenerado[0].selloDeTiempo
            this.nameDocgenerado = docGenerado[0].name
            this.lastInsertId = docGenerado[0].id
          }
        },
        error: (err) => {
          console.error('Error obteniendo documentos', err);
          this.reqGenerado = false; 
        }
      });
  }

  saveReasonRequest(): void {
    const motivo = this.formRequerimiento.get('motivoRequerimiento')?.value
    this.expedienteService.updateDocFieldExpediente(this.actualID, 'motivoRequerimiento', motivo).subscribe()
    this.noRequestReasonText = false
  }

  generateActoAdmin(actoAdministrivoName: string, tipoTramite: string, docFieldToUpdate: string): void {
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

  const marginLeft = 25;
  const maxTextWidth = 160; // Ajusta según el margen derecho
  const lineHeight = 4;
  const pageHeight = doc.internal.pageSize.getHeight();
  const lines = footerText.split('\n');

  lines.reverse().forEach((line, index) => {
    const y = pageHeight - 10 - (index * lineHeight);
    doc.text(line, marginLeft, y);
  });

  // obtengo el template json del acto adiministrativo y para el tipo trámite: XECS, ADR-ISBA o ILS
  this.actoAdminService.getByNameAndTipoTramite(actoAdministrivoName, tipoTramite)
    .subscribe((docDataString: any) => {
      const rawTexto = docDataString.texto;
      const cleanedTexto = rawTexto.trim().replace(/^`|`;?$/g, '');
      let jsonObject;
      try {
        jsonObject = JSON.parse(cleanedTexto);
      } catch (error) {
        console.error("Error al convertir el string a JSON:", error);
        return;
      }

      doc.addImage("../../../assets/images/logo-adrbalears-ceae-byn.png", "PNG", 25, 20, 75, 15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(doc.splitTextToSize(jsonObject.asunto, maxTextWidth), marginLeft, 90);
      doc.setFont('helvetica', 'normal');
      doc.text(doc.splitTextToSize(jsonObject.p1, maxTextWidth), marginLeft, 100);
      doc.text(doc.splitTextToSize(`• ${this.formRequerimiento.get('motivoRequerimiento')?.value}`, maxTextWidth), marginLeft, 125);
      doc.text(doc.splitTextToSize(jsonObject.p2, maxTextWidth), marginLeft, 135);
      doc.text(doc.splitTextToSize(jsonObject.p3, maxTextWidth), marginLeft, 150);
      doc.text(doc.splitTextToSize(jsonObject.firma, maxTextWidth), marginLeft, 220);
      doc.text(doc.splitTextToSize(`Palma, en fecha de la firma electrónica`, maxTextWidth), marginLeft, 225);

      // además de generar el pdf del acto administrativo ya que hay que enviarlo al backend
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
          // Hacer un INSERT en la tabla pindust_documentos_generados y recoger el id asignado al registro creado: 'last_insert_id'. Antes elimina los documentos generados, para evitar repeticiones
          this.docGeneradoInsert.id_sol = this.actualID
          this.docGeneradoInsert.cifnif_propietario = this.actualNif
          this.docGeneradoInsert.convocatoria = String(this.actualConvocatoria)
          this.docGeneradoInsert.name = `doc_${docFieldToUpdate}.pdf`
          this.docGeneradoInsert.type = 'application/pdf'
          this.docGeneradoInsert.created_at = response.path
          this.docGeneradoInsert.tipo_tramite = this.actualTipoTramite
          this.docGeneradoInsert.corresponde_documento = `doc_${docFieldToUpdate}`
          this.docGeneradoInsert.selloDeTiempo = timeStamp
          // delete documentos generados antes del insert para evitar duplicados
          this.documentosGeneradosService.deleteByIdSolNifConvoTipoDoc( this.actualID, this.actualNif, this.actualConvocatoria, 'doc_requeriment')
            .subscribe({
              next: () => {
                // Eliminado correctamente, o no había nada que eliminar
                console.log ("Eliminado correctamente, o no había nada que eliminar")
                this.crearDocumentoGenerado(docFieldToUpdate);
              },
              error: (deleteErr) => {
                const status = deleteErr?.status;
                const msg = deleteErr?.error?.message || '';
                // Si es "no encontrado" (por ejemplo, 404) seguimos el flujo normal
                if (status === 404 || msg.includes('no se encontró') || msg.includes('No existe')) {
                  this.commonService.showSnackBar('ℹ️ No había documento previo que eliminar.');
                  this.crearDocumentoGenerado(docFieldToUpdate);
                } else {
                // Otros errores sí se notifican y no continúan
                  const deleteErrMsg = msg || '❌ Error al eliminar el documento previo.';
                  this.commonService.showSnackBar(deleteErrMsg);
                }
              }
            });
         
            /*         this.documentosGeneradosService.deleteByIdSolNifConvoTipoDoc(this.actualID, this.actualNif, this.actualConvocatoria, 'doc_requeriment')
            .subscribe({
            next: () => {
              this.documentosGeneradosService.create(this.docGeneradoInsert).subscribe({
                next: (resp: any) => {
                  this.lastInsertId = resp?.id;
                  if (this.lastInsertId) {
                    this.expedienteService.updateDocFieldExpediente(this.actualID, 'doc_' + docFieldToUpdate, String(this.lastInsertId))
                    .subscribe({
                      next: (response: any) => {
                      const mensaje = response?.message || '✅ Acto administrativo generado y expediente actualizado correctamente.';
                      this.reqGenerado = true
                      this.commonService.showSnackBar(mensaje);
                    },
                    error: (updateErr) => {
                      const updateErrorMsg = updateErr?.error?.message || '⚠️ Documento generado, pero error al actualizar el expediente.';
                      this.commonService.showSnackBar(updateErrorMsg);
                    }
                    });
                  } else {
                    this.commonService.showSnackBar('⚠️ Documento generado, pero no se recibió el ID para actualizar el expediente.');
                  }
                },
                error: (insertErr) => {
                  const insertErrorMsg = insertErr?.error?.message || '❌ Error al guardar el documento generado.';
                  this.commonService.showSnackBar(insertErrorMsg);
                }
              });
            },
            error: (deleteErr) => {
              const deleteErrMsg = deleteErr?.error?.message || '❌ Error al eliminar el documento previo.';
              this.commonService.showSnackBar(deleteErrMsg);
            }
            }); */
        },
        error: (err) => {
          const errorMsg = err?.error?.message || '❌ Error al guardar el Acto administrativo.';
          this.commonService.showSnackBar(errorMsg);
        }
      });
    });
  }

  /** Método auxiliar para no repetir el bloque de creación */
  crearDocumentoGenerado(docFieldToUpdate: string): void {
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
              this.reqGenerado = true;
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
    console.log ("viewDocument", nif, folder, filename, extension)
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

  closeActoAdmin() {
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
      adreca_mail: this.email_rep ?? '',
      telefono_cont: this.telefono_rep ?? '',
      nombreDocumento: filename,
      nif: nif,
      last_insert_id: ''
    };

   this.viafirmaService.createSignatureRequest(payload)
  .pipe(finalize(() => { this.loading = false; }))
  .subscribe({
    next: (res) => {
      this.response = res;
      const id = res?.publicAccessId;
      this.commonService.showSnackBar( id ? `Solicitud de firma creada. ID: ${id}` : 'Solicitud de firma creada correctamente');
    },
    error: (err) => {
      const msg = err?.error?.message || err?.message || 'No se pudo enviar la solicitud de firma';
      this.error = msg;
      this.commonService.showSnackBar(msg);
    }
  });
  }  

}
