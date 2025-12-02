import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { ResolucionDePagoYJustificacionAdrIsbaService } from '../../Services/adr-isba-actos-admin/11-resolucion-de-pago-y-justificacion/resolucion-de-pago-y-justificacion.service';

@Component({
  selector: 'app-resolucion-de-pago-y-justificacion-adr-isba',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatExpansionModule, TranslateModule],
  templateUrl: './resolucion-de-pago-y-justificacion.component.html',
  styleUrl: './resolucion-de-pago-y-justificacion.component.scss'
})
export class ResolucionDePagoYJustificacionAdrIsbaComponent {
  private resPagoJustificacionService = inject(ResolucionDePagoYJustificacionAdrIsbaService);

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

  get stateClassActAdmin11(): string {
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
    this.resPagoJustificacionService.actoAdmin$.subscribe(actoAdmin => { this.actoAdmin = actoAdmin });
    this.resPagoJustificacionService.publicAccessId$.subscribe(publicAccessId => { this.publicAccessId = publicAccessId });
    this.resPagoJustificacionService.signatureDocState$.subscribe(signatureDocState => { this.signatureDocState = signatureDocState });
    this.resPagoJustificacionService.externalSignUrl$.subscribe(externalSignUrl => { this.externalSignUrl = externalSignUrl });
    this.resPagoJustificacionService.sendedUserToSign$.subscribe(sendedUserToSign => { this.sendedUserToSign = sendedUserToSign });
    this.resPagoJustificacionService.sendedDateToSign$.subscribe(sendedDateToSign => { this.sendedDateToSign = sendedDateToSign });
    this.resPagoJustificacionService.pdfUrl$.subscribe(pdfUrl => { this.pdfUrl = pdfUrl });
    this.resPagoJustificacionService.showPdfViewer$.subscribe(showPdfViewer => { this.showPdfViewer = showPdfViewer });
    this.resPagoJustificacionService.faltanCampos$.subscribe(faltanCampos => { this.faltanCampos = faltanCampos });
    this.resPagoJustificacionService.camposVacios$.subscribe(camposVacios => { this.camposVacios = camposVacios });
  }

  ngOnChanges(): void {
    this.resPagoJustificacionService.init(this.expediente, this.form);
  }

  getActoAdminDetail(): void {
    this.resPagoJustificacionService.getActoAdminDetail();
  }

  generateActoAdmin(): void {
    this.resPagoJustificacionService.generateActoAdmin();
  }

  viewActoAdmin(): void {
    this.resPagoJustificacionService.viewActoAdmin();
  }

  closeViewActoAdmin(): void {
    this.resPagoJustificacionService.closeViewActoAdmin();
  }

  sendActoAdminToSign(): void {
    this.resPagoJustificacionService.sendActoAdminToSign();
  }
}
