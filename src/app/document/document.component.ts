import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { DocumentService } from '../Services/document.service';
import { HttpEventType } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { CommonService } from '../Services/common.service';
import { ExpedienteDocumentoService } from '../Services/expediente.documento.service';
import { ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { PdfViewerModule } from 'ng2-pdf-viewer';

export interface Documento {
  id_sol: number;
  name: string;
  extension: string;
  url: string;
  estado: string;
}

@Component({
  selector: 'app-document',
  standalone: true,
  imports: [
    CommonModule,
    MatSnackBarModule, HttpClientModule,
    MatDialogModule,
    MatCheckboxModule,
    MatButtonModule, PdfViewerModule,
    FormsModule,
    MatTableModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './document.component.html',
  styleUrls: ['./document.component.scss']
})
export class DocumentComponent implements OnInit {
  showConfirmation: boolean = false
  isLoading: boolean = false
  documents: any[] = []
  selectedFiles: File[] = []
  foldername: string | undefined
  subfolderId: number | undefined
  message: string = ''
  progress: number = 0
  pdfUrl: SafeResourceUrl | null = null
  imageUrl: SafeUrl | undefined
  showPdfViewer: boolean = false
  showImageViewer: boolean = false

  @Input() id!: string
  @Input() idSol!: number
  @Input() origin!: string
  @Input() requiredDocs!: string
  @Input() convocatoria!: number
  @Input() faseExped!: string

  constructor( private sanitizer: DomSanitizer,  private http: HttpClient,
    private documentService: DocumentService,
    private dialog: MatDialog, private cdr: ChangeDetectorRef,
    private commonService: CommonService, private expedienteDocumentoService: ExpedienteDocumentoService
  ) {  }

  ngOnInit(): void {
    setTimeout(() => {
      this.listDocuments(this.idSol, this.requiredDocs, this.faseExped);
    });
  } 

  onFileSelected(event: any): void {
    this.selectedFiles = Array.from(event.target.files);
    this.showConfirmation = true;
  }

  confirmUpload() {
    this.uploadDocuments();
  }

  listDocuments(idSol: number, isRequiredDoc?: string, faseExped?: string): void {
  if (!idSol) {
    this.commonService.showSnackBar("Faltan datos para cargar los documentos.");
    return;
  }
  
  this.documentService.listDocuments(idSol, isRequiredDoc, faseExped).subscribe(
    (response: any) => {
      if (response.status === 'success') {
        const documentosConId = response.data.map((doc: any) => ({
          ...doc,
          id_sol: idSol,
          estado: doc.state || 'Pendent'
        }));

        this.documents = documentosConId;

        if (this.documents.length > 0) {
          /* this.commonService.showSnackBar("Documentos cargados correctamente."); */
        } else {
          this.commonService.showSnackBar("No se encontraron documentos válidos.");
        }
      } else if (response.status === 'error') {
        this.commonService.showSnackBar(response.message || "Error al cargar los documentos.");
      }
    },
    (error) => {
      console.error(error);
      // Verificar si el backend devolvió un error con cuerpo en formato JSON
      if (error?.error?.message) {
        this.commonService.showSnackBar(error.error.message);
      } else {
        //this.commonService.showSnackBar("Ocurrió un error al comunicarse con el servidor.");
      }
    }
  );
  }

  uploadDocuments() {
    if (!this.foldername || this.subfolderId === undefined) {
      this.commonService.showSnackBar("Faltan datos para cargar los documentos.");
      return;
    }

    this.isLoading = true;
    this.showConfirmation = false;

    if (this.selectedFiles.length > 0) {
      const formData = new FormData();
      this.selectedFiles.forEach(file => formData.append('documents[]', file, file.name));

      this.documentService.createDocument(this.origin, this.id, formData).subscribe(
        (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            this.progress = Math.round(100 * event.loaded / (event.total ?? 1));
          } else if (event.type === HttpEventType.Response) {
            this.isLoading = false;
            this.commonService.showSnackBar('Documents uploaded successfully!');
            this.listDocuments(+this.idSol, this.requiredDocs);
            this.selectedFiles = [];
            this.progress = 0;
          }
        },
        (error: any) => {
          this.commonService.showSnackBar(error);
          this.listDocuments(+this.idSol, this.requiredDocs);
        }
      );
    }
  }

 viewDocument(nif: string, folder: string, filename: string, extension: string) {
    const url = `https://pre-tramits.idi.es/public/index.php/documents/view/${nif}/${folder}/${filename}`;
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

  closePdf() {
    this.showPdfViewer = false;
    this.pdfUrl = null;
  }

  closeImg() {
    this.showImageViewer = false;
    this.imageUrl = undefined;
  }

  deleteDocument(nif: string, folder: string, filename: string) {
    if (!nif || !folder || !filename) {
      this.commonService.showSnackBar("Faltan datos para eliminar el documento");
      return;
    }

    this.documentService.deleteDocument(nif, folder, filename).subscribe(
      (resp:any) => {
    
        this.commonService.showSnackBar('Document deleted successfully! '+resp);
        this.listDocuments(this.idSol, this.requiredDocs);
      },
      (error) => this.commonService.showSnackBar(error)
    );
  }

  changeDocumentState(documento: Documento) {
  const payload = {
    id_sol: documento.id_sol,
    name: documento.name
  };

  this.expedienteDocumentoService.changeDocumentoExpedienteState(payload).subscribe({
    next: (respuesta) => {
      console.log('Respuesta del backend:', respuesta);
      this.commonService.showSnackBar(respuesta.message);

      if (respuesta?.data?.estadoNuevo) {
        // Buscar el índice del documento en la lista
        const index = this.documents.findIndex(doc =>
          doc.id_sol === documento.id_sol && doc.name === documento.name
        );
        if (index !== -1) {
          // Reemplazar el objeto por una nueva referencia con el estado actualizado
          this.documents[index] = {
            ...this.documents[index],
            estado: respuesta.data.estadoNuevo
          };

          // Forzar detección de cambios (opcional si no se actualiza automáticamente)
          this.documents = [...this.documents];
        }
      }
    },
    error: (error) => {
      this.commonService.showSnackBar('Error al cambiar estado del documento: ' + (error.message || error));
    }
  });
  }

  getButtonColor(state: string): 'primary' | 'accent' | 'warn' | undefined {
  switch (state) {
    case 'Aprovat':
      return 'accent'; // morado
    case 'Rebutjat':
      return 'warn'; // rojo
    case 'Pendent':
      return 'primary'; // azul
    default:
      return undefined;
  }
  }

  getButtonIcon(state: string): string {
  switch (state) {
    case 'Aprovat':
      return 'check_circle'; // ✅
    case 'Rebutjat':
      return 'cancel'; // ❌
    case 'Pendent':
      return 'hourglass_empty'; // ⏳
    default:
      return 'help_outline'; // ?
  }
  }
}
