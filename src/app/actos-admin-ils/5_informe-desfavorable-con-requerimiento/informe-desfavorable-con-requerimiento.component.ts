import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { InformeDesfavorableConRequerimientoIlsService } from '../../Services/ils-actos-admin/5-informe-desfavorable-con-requerimiento/informe-desfavorable-con-requerimiento.service';

@Component({
  selector: 'app-informe-desfavorable-con-requerimiento-ils',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatExpansionModule, MatButtonModule],
  templateUrl: './informe-desfavorable-con-requerimiento.component.html',
  styleUrl: './informe-desfavorable-con-requerimiento.component.scss'
})
export class InformeDesfavorableConRequerimientoIlsComponent {
  private informeDesfavorableConRequerimientoService = inject(InformeDesfavorableConRequerimientoIlsService);

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
    this.informeDesfavorableConRequerimientoService.actoAdmin$.subscribe(actoAdmin => { this.actoAdmin = actoAdmin });
    this.informeDesfavorableConRequerimientoService.publicAccessId$.subscribe(publicAccessId => { this.publicAccessId = publicAccessId });
    this.informeDesfavorableConRequerimientoService.signatureDocState$.subscribe(signatureDocState => { this.signatureDocState = signatureDocState });
    this.informeDesfavorableConRequerimientoService.externalSignUrl$.subscribe(externalSignUrl => { this.externalSignUrl = externalSignUrl });
    this.informeDesfavorableConRequerimientoService.sendedUserToSign$.subscribe(sendedUserToSign => { this.sendedUserToSign = sendedUserToSign });
    this.informeDesfavorableConRequerimientoService.sendedDateToSign$.subscribe(sendedDateToSign => { this.sendedDateToSign = sendedDateToSign });
    this.informeDesfavorableConRequerimientoService.pdfUrl$.subscribe(pdfUrl => { this.pdfUrl = pdfUrl });
    this.informeDesfavorableConRequerimientoService.showPdfViewer$.subscribe(showPdfViewer => { this.showPdfViewer = showPdfViewer });
    this.informeDesfavorableConRequerimientoService.faltanCampos$.subscribe(faltanCampos => { this.faltanCampos = faltanCampos });
    this.informeDesfavorableConRequerimientoService.camposVacios$.subscribe(camposVacios => { this.camposVacios = camposVacios });
  }

  ngOnChanges(): void {
    this.informeDesfavorableConRequerimientoService.init(this.expediente, this.form);
  }

  getActoAdminDetail(): void {
    this.informeDesfavorableConRequerimientoService.getActoAdminDetail();
  }

  generateActoAdmin(): void {
    this.informeDesfavorableConRequerimientoService.generateActoAdmin();
  }

  viewActoAdmin(): void {
    this.informeDesfavorableConRequerimientoService.viewActoAdmin();
  }

  closeViewActoAdmin(): void {
    this.informeDesfavorableConRequerimientoService.closeViewActoAdmin();
  }


  sendActoAdminToSign(): void {
    this.informeDesfavorableConRequerimientoService.sendActoAdminToSign();
  }
}
