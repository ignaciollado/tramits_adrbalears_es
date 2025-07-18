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

@Component({
  selector: 'app-document',
  standalone: true,
  imports: [
    CommonModule,
    MatSnackBarModule,
    MatDialogModule,
    MatCheckboxModule,
    MatButtonModule,
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
  showConfirmation: boolean = false;
  isLoading: boolean = false;
  documents: any[] = [];
  selectedFiles: File[] = [];
  foldername: string | undefined;
  subfolderId: number | undefined;
  message: string = '';
  progress: number = 0;

  @Input() id!: string;
  @Input() idSol!: number;
  @Input() origin!: string;
  @Input() requriedDocs!: string;
  @Input() convocatoria!: number;

  constructor(
    private documentService: DocumentService,
    private dialog: MatDialog,
    private commonService: CommonService
  ) {  }

ngOnInit(): void {
  setTimeout(() => {
    this.listDocuments(this.idSol, this.requriedDocs);
  });
}

  onFileSelected(event: any): void {
    this.selectedFiles = Array.from(event.target.files);
    this.showConfirmation = true;
  }

  confirmUpload() {
    this.uploadDocuments();
  }

listDocuments(idSol: number, isRequiredDoc: string): void {
  if (!idSol) {
    this.commonService.showSnackBar("Faltan datos para cargar los documentos.");
    return;
  }

  this.documentService.listDocuments(idSol, isRequiredDoc).subscribe(
    (response:any) => {
      if (response.status === 'success') {
        this.documents = response.data
        console.log ("response.data", response.data, this.documents)

        if (this.documents.length > 0) {
          this.commonService.showSnackBar("Documentos cargados correctamente.");
        } else {
          this.commonService.showSnackBar("No se encontraron documentos válidos.");
        }
      } else {
        this.commonService.showSnackBar("Error al cargar los documentos.");
      }
    },
    (error) => {
      console.error("Error al obtener documentos:", error);
      this.commonService.showSnackBar("Error al obtener los documentos del servidor.");
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
            this.listDocuments(+this.idSol, this.requriedDocs);
            this.selectedFiles = [];
            this.progress = 0;
          }
        },
        (error: any) => {
          this.commonService.showSnackBar(error);
          this.listDocuments(+this.idSol, this.requriedDocs);
        }
      );
    }
  }

  viewDocument(path: string) {
    if (!this.foldername || this.subfolderId === undefined) {
      this.commonService.showSnackBar("Faltan datos para cargar los documentos.");
      return;
    }

    const newPath = path.replace('/home/dataibrelleu/www/writable/uploads/', '');
    this.documentService.listDocuments(this.idSol, this.requriedDocs).subscribe((doc: any) => {
      console.log(doc);
    });
  }

  deleteDocument(docName: string) {
    if (!this.foldername || this.subfolderId === undefined) {
      this.commonService.showSnackBar("Faltan datos para cargar los documentos.");
      return;
    }

    this.documentService.deleteDocument(this.foldername, this.subfolderId, docName).subscribe(
      () => {
        this.documents = this.documents.filter(doc => doc.id !== docName);
        this.commonService.showSnackBar('Document deleted successfully!');
        this.listDocuments(this.idSol, this.requriedDocs);
      },
      (error) => this.commonService.showSnackBar(error)
    );
  }

  aproveDocument(docName: string) {
    console.log (docName)
  }
}
