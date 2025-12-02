import { CommonModule, formatDate } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import jsPDF from 'jspdf';
import { finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ActoAdministrativoDTO } from '../../Models/acto-administrativo-dto';
import { ConfigurationModelDTO } from '../../Models/configuration.dto';
import { DocSignedDTO } from '../../Models/docsigned.dto';
import { DocumentoGeneradoDTO } from '../../Models/documentos-generados-dto';
import { PindustLineaAyudaDTO } from '../../Models/linea-ayuda-dto';
import { CreateSignatureRequest, SignatureResponse } from '../../Models/signature.dto';
import { ActoAdministrativoService } from '../../Services/acto-administrativo.service';
import { CommonService } from '../../Services/common.service';
import { DocumentosGeneradosService } from '../../Services/documentos-generados.service';
import { ExpedienteService } from '../../Services/expediente.service';
import { PindustLineaAyudaService } from '../../Services/linea-ayuda.service';
import { PindustConfiguracionService } from '../../Services/pindust-configuracion.service';
import { ViafirmaService } from '../../Services/viafirma.service';
import { PrDefinitivaFavorableAdrIsbaService } from '../../Services/adr-isba-actos-admin/7-pr-definitiva-favorable/pr-definitiva-favorable.service';

@Component({
  selector: 'app-pr-definitiva-favorable-adr-isba',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, MatExpansionModule, MatButtonModule],
  templateUrl: './pr-definitiva-favorable.component.html',
  styleUrl: './pr-definitiva-favorable.component.scss'
})
export class PrDefinitivaFavorableAdrIsbaComponent {
  private prDefinitivaFavorableService = inject(PrDefinitivaFavorableAdrIsbaService);

  signatureDocState!: string;
  actoAdmin!: boolean;
  publicAccessId!: string;
  externalSignUrl!: string;
  sendedUserToSign!: string;
  sendedDateToSign!: Date;
  pdfUrl: SafeResourceUrl | null = null;
  showPdfViewer!: boolean;
  faltanCampos!: boolean;
  camposVacios!: string[];

  @Input() expediente!: any;
  @Input() form!: FormGroup;
  constructor() {
  }

  get stateClassActAdmin7(): string {
    const map: Record<string, string> = {
      NOT_STARTED: 'req-state--not-started',
      IN_PROCESS: 'req-state--in-process',
      COMPLETED: 'req-state--completed',
      REJECTED: 'req-state--rejected',
    };
    return map[this.signatureDocState ?? ''] ?? 'req-state--not-started';
  }

  ngOnInit(): void {
    // BehaviorSubject
    this.prDefinitivaFavorableService.actoAdmin$.subscribe(actoAdmin => { this.actoAdmin = actoAdmin });
    this.prDefinitivaFavorableService.publicAccessId$.subscribe(publicAccessId => { this.publicAccessId = publicAccessId });
    this.prDefinitivaFavorableService.signatureDocState$.subscribe(signatureDocState => { this.signatureDocState = signatureDocState });
    this.prDefinitivaFavorableService.externalSignUrl$.subscribe(externalSignUrl => { this.externalSignUrl = externalSignUrl });
    this.prDefinitivaFavorableService.sendedUserToSign$.subscribe(sendedUserToSign => { this.sendedUserToSign = sendedUserToSign });
    this.prDefinitivaFavorableService.sendedDateToSign$.subscribe(sendedDateToSign => { this.sendedDateToSign = sendedDateToSign });
    this.prDefinitivaFavorableService.pdfUrl$.subscribe(pdfUrl => { this.pdfUrl = pdfUrl });
    this.prDefinitivaFavorableService.showPdfViewer$.subscribe(showPdfViewer => { this.showPdfViewer = showPdfViewer });
    this.prDefinitivaFavorableService.faltanCampos$.subscribe(faltanCampos => { this.faltanCampos = faltanCampos });
    this.prDefinitivaFavorableService.camposVacios$.subscribe(camposVacios => { this.camposVacios = camposVacios });
  }

  ngOnChanges(): void {
    this.prDefinitivaFavorableService.init(this.expediente, false, this.form);
  }

  getActoAdminDetail(): void {
    this.prDefinitivaFavorableService.getActoAdminDetail();
  }

  generateActoAdmin(): void {
    this.prDefinitivaFavorableService.generateActoAdmin();
  }

  viewActoAdmin(): void {
    this.prDefinitivaFavorableService.viewActoAdmin();
  }

  closeViewActoAdmin(): void {
    this.prDefinitivaFavorableService.closeViewActoAdmin();
  }

  sendActoAdminToSign(): void {
    this.prDefinitivaFavorableService.sendActoAdminToSign();
  }
}
