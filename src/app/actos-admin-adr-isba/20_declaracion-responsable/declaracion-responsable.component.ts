import { CommonModule } from '@angular/common';
import { Component, Input, SimpleChange } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { DocSignedDTO } from '../../Models/docsigned.dto';
import { DocumentoGeneradoDTO } from '../../Models/documentos-generados-dto';
import { CommonService } from '../../Services/common.service';
import { DocumentosGeneradosService } from '../../Services/documentos-generados.service';
import { ViafirmaService } from '../../Services/viafirma.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-declaracion-responsable-adr-isba',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './declaracion-responsable.component.html',
  styleUrl: './declaracion-responsable.component.scss'
})
export class DeclaracionResponsableAdrIsbaComponent {
  pdfUrl: SafeResourceUrl | null = null;
  showPdfViewer: boolean = false;
  loading: boolean = false;
  lastInsertId: number | undefined;
  publicAccessId: string = "";
  timeStampDocGenerado: string = "";
  nameDocGenerado: string = "";
  signatureDocState: string = "";
  externalSignUrl: string = "";
  sendedDateToSign!: Date;

  @Input() actualID!: number;
  @Input() actualNif: string = "";
  @Input() actualConvocatoria!: number;
  constructor(
    private commonService: CommonService, private sanitizer: DomSanitizer,
    private documentoGeneradoService: DocumentosGeneradosService,
    private viafirmaService: ViafirmaService
  ) { }

  ngOnChanges(changes: SimpleChange): void {
    if (this.tieneTodosLosValores()) {
      this.getDeclaracionResponsable();
    }
  }

  private tieneTodosLosValores() {
    return (
      this.actualID != null &&
      !!this.actualNif &&
      this.actualConvocatoria != null
    );
  }

  get stateClassDeclResponsable(): string {
    const map: Record<string, string> = {
      NOT_STARTED: 'req-state--not-started',
      IN_PROCESS: 'req-state--in-process',
      COMPLETED: 'req-state--completed',
      REJECTED: 'req-state--rejected',
    }
    return map[this.signatureDocState ?? ''] ?? 'req-state--not-started';
  }

  getDeclaracionResponsable(): void {
    this.documentoGeneradoService.getDocumentosGenerados(this.actualID, this.actualNif, this.actualConvocatoria, 'doc_declaracion_responsable_idi_isba')
      .subscribe({
        next: (docDeclaracionRes: DocumentoGeneradoDTO[]) => {
          if (docDeclaracionRes.length === 1) {
            this.timeStampDocGenerado = docDeclaracionRes[0].selloDeTiempo;
            this.nameDocGenerado = docDeclaracionRes[0].name;
            this.lastInsertId = docDeclaracionRes[0].id;
            this.publicAccessId = docDeclaracionRes[0].publicAccessId;
            if (this.publicAccessId) {
              this.getSignState(this.publicAccessId)
            }
          }
        }
      })
  }

  getSignState(publicAccessId: string): void {
    this.viafirmaService.getDocumentStatus(publicAccessId)
      .subscribe((resp: DocSignedDTO) => {
        this.signatureDocState = resp.status;
        this.externalSignUrl = resp.addresseeLines[0].addresseeGroups[0].userEntities[0].externalSignUrl;
        const sendedDateToSign = resp.creationDate;
        this.sendedDateToSign = new Date(sendedDateToSign);

      })
  }

  // Lo cambio para poder visualizar correctamente la declaración responsable
  viewDocumento(nif: string, folder: string, filename: string, extension: string) {
    const entorno = environment.apiUrl
    filename = filename.replace(/^doc_/, "");
    filename = `${this.actualNif}_${filename}`;
    const url = `${entorno}/documents/view/${nif}/${folder}/${filename}`;

    const sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);

    const ext = extension.toLowerCase();
    if (ext === "jpg" || ext === "jpeg") {
      this.showPdfViewer = false;
      this.pdfUrl = null;
    } else {
      this.showPdfViewer = true;
      this.pdfUrl = sanitizedUrl;
    }
  }

  closeViewDocumento(): void {
    this.showPdfViewer = false;
    this.pdfUrl = null;
  }

  viewDocumentoFirmado(): void {
    window.open(this.externalSignUrl, '_blank');
  }
}
