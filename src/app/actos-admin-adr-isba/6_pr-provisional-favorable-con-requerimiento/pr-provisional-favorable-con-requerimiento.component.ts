import { CommonModule, formatDate } from '@angular/common';
import { Component, inject, Input, SimpleChanges } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import jsPDF from 'jspdf';
import { finalize } from 'rxjs';
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
import { environment } from '../../../environments/environment';
import { PrProvisionalFavorableConRequerimientoAdrIsbaService } from '../../Services/adr-isba-actos-admin/6-pr-provisional-favorable-con-requerimiento/pr-provisional-favorable-con-requerimiento.service';

@Component({
  selector: 'app-pr-provisional-favorable-con-requerimiento-adr-isba',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, MatExpansionModule, MatButtonModule],
  templateUrl: './pr-provisional-favorable-con-requerimiento.component.html',
  styleUrl: './pr-provisional-favorable-con-requerimiento.component.scss'
})
export class PrProvisionalFavorableConRequerimientoAdrIsbaComponent {
  private prProvisionalFavorableConRequerimientoService = inject(PrProvisionalFavorableConRequerimientoAdrIsbaService);

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

  constructor(
  ) { }

  get stateClassActAdmin6(): string {
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
    this.prProvisionalFavorableConRequerimientoService.actoAdmin$.subscribe(actoAdmin => { this.actoAdmin = actoAdmin });
    this.prProvisionalFavorableConRequerimientoService.publicAccessId$.subscribe(publicAccessId => { this.publicAccessId = publicAccessId });
    this.prProvisionalFavorableConRequerimientoService.signatureDocState$.subscribe(signatureDocState => { this.signatureDocState = signatureDocState });
    this.prProvisionalFavorableConRequerimientoService.externalSignUrl$.subscribe(externalSignUrl => { this.externalSignUrl = externalSignUrl });
    this.prProvisionalFavorableConRequerimientoService.sendedUserToSign$.subscribe(sendedUserToSign => { this.sendedUserToSign = sendedUserToSign });
    this.prProvisionalFavorableConRequerimientoService.sendedDateToSign$.subscribe(sendedDateToSign => { this.sendedDateToSign = sendedDateToSign });
    this.prProvisionalFavorableConRequerimientoService.pdfUrl$.subscribe(pdfUrl => { this.pdfUrl = pdfUrl });
    this.prProvisionalFavorableConRequerimientoService.showPdfViewer$.subscribe(showPdfViewer => { this.showPdfViewer = showPdfViewer });
    this.prProvisionalFavorableConRequerimientoService.faltanCampos$.subscribe(faltanCampos => { this.faltanCampos = faltanCampos });
    this.prProvisionalFavorableConRequerimientoService.camposVacios$.subscribe(camposVacios => { this.camposVacios = camposVacios });
  }

  ngOnChanges(): void {
    this.prProvisionalFavorableConRequerimientoService.init(this.expediente, this.form);
  }


  getActoAdminDetail(): void {
    this.prProvisionalFavorableConRequerimientoService.getActoAdminDetail();
  }

  generateActoAdmin(): void {
    this.prProvisionalFavorableConRequerimientoService.generateActoAdmin();
  }

  viewActoAdmin(): void {
    this.prProvisionalFavorableConRequerimientoService.viewActoAdmin();
  }

  closeViewActoAdmin(): void {
    this.prProvisionalFavorableConRequerimientoService.closeViewActoAdmin();
  }

  sendActoAdminToSign(): void {
    this.prProvisionalFavorableConRequerimientoService.sendActoAdminToSign();
  }
}
