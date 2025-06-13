import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogContent, MatDialogActions, MatDialogClose, MatButtonModule],
  templateUrl: './popup-dialog.component.html',
  styleUrls: ['./popup-dialog.component.scss']
})

export class PopUpDialogComponent {
  isPdf1: boolean = false
  isPdf2: boolean = false
  confirmDialog?: boolean = false

  constructor( private http: HttpClient, public dialogRef: MatDialogRef<PopUpDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {questionText:string, toolTipText: string, doc1: string, doc2: string, confirmDialog?: boolean}
    ) {
      const containsAssetsPath = data.toolTipText.includes("../../../assets/data/");
      
    if (containsAssetsPath) {
      this.http.get(data.toolTipText, { responseType: 'text' })
      .subscribe({ 
        next: (html) => this.data.toolTipText = html,
        error: () => this.data.toolTipText = '<p>Error al cargar el contenido.</p>' });
    }

    this.confirmDialog = data.confirmDialog

    if (data.doc1) {
        if (data.doc1.split(".")[1]==='pdf') {
          this.isPdf1 = true
        }
    }
    if (data.doc2) {
        if (data.doc2.split(".")[1]==='pdf') {
          this.isPdf2 = true
        }
    }      
  }
    
    onCommand(): void {
      this.dialogRef.close(true);
    }
}
