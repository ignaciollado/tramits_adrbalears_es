7
import { Component, OnInit, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DocumentService } from '../../Services/document.service';
import { HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-document',
  templateUrl: './document.component.html',
  styleUrls: ['./document.component.scss']
})
export class DocumentComponent implements OnInit {
  showConfirmation:boolean = false;
  isLoading:boolean = false;
  documents: any[] = [];
  selectedFiles: File[] = [];
  foldername: string = '';
  subfolderId: number;
  message: string = '';
  progress: number = 0

  @Input() id: string;
  @Input() origin: string;

  constructor(private documentService: DocumentService, private snackBar: MatSnackBar, private dialog: MatDialog) { }

  ngOnInit(): void {
    this.foldername = this.origin
    this.subfolderId = +this.id
    this.loadDocuments();
  }

  onFileSelected(event: any): void {
    this.selectedFiles = Array.from(event.target.files);
    this.showConfirmation = true;
  }

  confirmUpload() {
    this.uploadDocuments();
  }

  loadDocuments() {
    this.documentService.getDocuments(this.foldername, this.subfolderId).subscribe(
      (data) => {
        this.documents = data
        console.log ("documentos: ", this.documents)
        this.showSnackBar("Documents listed successfully!!")
      },
      (error) => this.showSnackBar(error)
    );
  }

  uploadDocuments() {
    this.isLoading = true;
    this.showConfirmation = false
    if (this.selectedFiles.length > 0) {
      const formData = new FormData();
      this.selectedFiles.forEach(file => formData.append('documents[]', file, file.name));
      this.documentService.uploadDocuments(this.foldername, this.subfolderId, formData).subscribe(
        (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            this.progress = Math.round(100 * event.loaded / (event.total ?? 1));
          } else if (event.type === HttpEventType.Response) {
            this.isLoading = false;
            this.showSnackBar('Documents uploaded successfully!');
            this.loadDocuments();
            this.selectedFiles = [];
            this.progress = 0;
          }
        },
        (error: any) => {
          this.showSnackBar(error)
          this.loadDocuments()
        }
      );
    }
  }

  viewDocument(path: string) {
    let newPath: string = ""
    newPath = path.replace('/home/dataibrelleu/www/writable/uploads/', '')
    this.documentService.viewDocument(newPath)
    .subscribe((doc:any) => {
      console.log (doc)
    })
  }

  deleteDocument(docName: string) {
    this.documentService.deleteDocument(this.foldername, this.subfolderId, docName).subscribe(
      (response) => {
        this.documents = this.documents.filter(doc => doc.id !== docName);
        this.showSnackBar('Document deleted successfully!');
        this.loadDocuments();
      },
      (error) => this.showSnackBar(error)
    );
  }

  private showSnackBar(error: string): void {
    this.snackBar.open( error, 'Close', { duration: 5000, verticalPosition: 'top', 
      horizontalPosition: 'center', panelClass: ["custom-snackbar"]} );
  }

 /*  openFileContent(document: any) {
    this.dialog.open(FileContentDialogComponent, {
      data: { name: document.name, path: document.path }
    });
  } */
}
