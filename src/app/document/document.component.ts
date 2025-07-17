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
  @Input() origin!: string;

  constructor(
    private documentService: DocumentService,
    private dialog: MatDialog,
    private commonService: CommonService
  ) {  }

ngOnInit(): void {
  setTimeout(() => {
    this.loadDocuments(this.origin, this.id);
  });
}

  onFileSelected(event: any): void {
    this.selectedFiles = Array.from(event.target.files);
    this.showConfirmation = true;
  }

  confirmUpload() {
    this.uploadDocuments();
  }

  loadDocuments(origin: string, id:string) {
    if (!origin || !id) {
      this.commonService.showSnackBar("Faltan datos para cargar los documentos.");
      return;
    }

    this.documentService.listDocuments(origin, id).subscribe(
      (data) => {
        this.documents = data;
        this.commonService.showSnackBar("Documents listed successfully!!");
      },
      (error) => this.commonService.showSnackBar(error)
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
            this.loadDocuments(this.origin, this.id);
            this.selectedFiles = [];
            this.progress = 0;
          }
        },
        (error: any) => {
          this.commonService.showSnackBar(error);
          this.loadDocuments(this.origin, this.id);
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
    this.documentService.listDocuments(this.foldername, newPath).subscribe((doc: any) => {
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
        this.loadDocuments(this.origin, this.id);
      },
      (error) => this.commonService.showSnackBar(error)
    );
  }
}
