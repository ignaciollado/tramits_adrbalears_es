import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { ResolConcesionAdhesionConRequerimientoIlsService } from '../../Services/ils-actos-admin/8-resol-concesion-adhesion-con-requerimiento/resol-concesion-adhesion-con-requerimiento.service';

@Component({
  selector: 'app-resol-concesion-adhesion-con-requerimiento-ils',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatExpansionModule, MatButtonModule],
  templateUrl: './resol-concesion-adhesion-con-requerimiento.component.html',
  styleUrl: './resol-concesion-adhesion-con-requerimiento.component.scss'
})
export class ResolConcesionAdhesionConRequerimientoIlsComponent {
  private resolConAdhConRequerimientoService = inject(ResolConcesionAdhesionConRequerimientoIlsService);

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

  get stateClass(): string {
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
    this.resolConAdhConRequerimientoService.actoAdmin$.subscribe(actoAdmin => { this.actoAdmin = actoAdmin });
    this.resolConAdhConRequerimientoService.publicAccessId$.subscribe(publicAccessId => { this.publicAccessId = publicAccessId });
    this.resolConAdhConRequerimientoService.signatureDocState$.subscribe(signatureDocState => { this.signatureDocState = signatureDocState });
    this.resolConAdhConRequerimientoService.externalSignUrl$.subscribe(externalSignUrl => { this.externalSignUrl = externalSignUrl });
    this.resolConAdhConRequerimientoService.sendedUserToSign$.subscribe(sendedUserToSign => { this.sendedUserToSign = sendedUserToSign });
    this.resolConAdhConRequerimientoService.sendedDateToSign$.subscribe(sendedDateToSign => { this.sendedDateToSign = sendedDateToSign });
    this.resolConAdhConRequerimientoService.pdfUrl$.subscribe(pdfUrl => { this.pdfUrl = pdfUrl });
    this.resolConAdhConRequerimientoService.showPdfViewer$.subscribe(showPdfViewer => { this.showPdfViewer = showPdfViewer });
    this.resolConAdhConRequerimientoService.faltanCampos$.subscribe(faltanCampos => { this.faltanCampos = faltanCampos });
    this.resolConAdhConRequerimientoService.camposVacios$.subscribe(camposVacios => { this.camposVacios = camposVacios });
  }

  ngOnChanges(): void {
    this.resolConAdhConRequerimientoService.init(this.expediente, this.form);
  }


  generateActoAdmin(): void {
    this.resolConAdhConRequerimientoService.generateActoAdmin();
  }

  getActoAdminDetail(): void {
    this.resolConAdhConRequerimientoService.getActoAdminDetail();

  }
  viewActoAdmin(): void {
    this.resolConAdhConRequerimientoService.viewActoAdmin();
  }

  closeViewActoAdmin(): void {
    this.resolConAdhConRequerimientoService.closeViewActoAdmin();
  }

  sendActoAdminToSign(): void {
    this.resolConAdhConRequerimientoService.sendActoAdminToSign();
  }
}
