import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { ResolucionConcesionConRequerimientoAdrIsbaService } from '../../Services/adr-isba-actos-admin/10-resolucion-concesion-con-requerimiento/resolucion-concesion-con-requerimiento.service';

@Component({
  selector: 'app-resolucion-concesion-con-requerimiento-adr-isba',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, MatExpansionModule, MatButtonModule],
  templateUrl: './resolucion-concesion-con-requerimiento.component.html',
  styleUrl: './resolucion-concesion-con-requerimiento.component.scss'
})
export class ResolucionConcesionConRequerimientoAdrIsbaComponent {
  private resolConcesionConRequerimientoService = inject(ResolucionConcesionConRequerimientoAdrIsbaService);

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
  ) {
  }

  get stateClassActAdmin10(): string {
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
    this.resolConcesionConRequerimientoService.actoAdmin$.subscribe(actoAdmin => { this.actoAdmin = actoAdmin });
    this.resolConcesionConRequerimientoService.publicAccessId$.subscribe(publicAccessId => { this.publicAccessId = publicAccessId });
    this.resolConcesionConRequerimientoService.signatureDocState$.subscribe(signatureDocState => { this.signatureDocState = signatureDocState });
    this.resolConcesionConRequerimientoService.externalSignUrl$.subscribe(externalSignUrl => { this.externalSignUrl = externalSignUrl });
    this.resolConcesionConRequerimientoService.sendedUserToSign$.subscribe(sendedUserToSign => { this.sendedUserToSign = sendedUserToSign });
    this.resolConcesionConRequerimientoService.sendedDateToSign$.subscribe(sendedDateToSign => { this.sendedDateToSign = sendedDateToSign });
    this.resolConcesionConRequerimientoService.pdfUrl$.subscribe(pdfUrl => { this.pdfUrl = pdfUrl });
    this.resolConcesionConRequerimientoService.showPdfViewer$.subscribe(showPdfViewer => { this.showPdfViewer = showPdfViewer });
    this.resolConcesionConRequerimientoService.faltanCampos$.subscribe(faltanCampos => { this.faltanCampos = faltanCampos });
    this.resolConcesionConRequerimientoService.camposVacios$.subscribe(camposVacios => { this.camposVacios = camposVacios });
  }

  ngOnChanges(): void {
    this.resolConcesionConRequerimientoService.init(this.expediente, this.form, false);
  }

  getActoAdminDetail(): void {
    this.resolConcesionConRequerimientoService.getActoAdminDetail();
  }

  generateActoAdmin(): void {
    this.resolConcesionConRequerimientoService.generateActoAdmin();
  }

  viewActoAdmin(): void {
    this.resolConcesionConRequerimientoService.viewActoAdmin();
  }

  closeViewActoAdmin(): void {
    this.resolConcesionConRequerimientoService.closeViewActoAdmin();
  }

  sendActoAdminToSign(): void {
    this.resolConcesionConRequerimientoService.sendActoAdminToSign();
  }

}
