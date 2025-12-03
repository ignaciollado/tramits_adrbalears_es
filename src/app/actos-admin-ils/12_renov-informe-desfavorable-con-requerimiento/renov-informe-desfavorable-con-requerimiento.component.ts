import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { RenovInformeDesfavorableConRequerimientoIlsService } from '../../Services/ils-actos-admin/12-renov-informe-desfavorable-con-requerimiento/renov-informe-desfavorable-con-requerimiento.service';

@Component({
  selector: 'app-renov-informe-desfavorable-con-requerimiento-ils',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, TranslateModule, MatButtonModule],
  templateUrl: './renov-informe-desfavorable-con-requerimiento.component.html',
  styleUrl: './renov-informe-desfavorable-con-requerimiento.component.scss'
})
export class RenovInformeDesfavorableConRequerimientoIlsComponent {
  private renovInfDesfConRequerimientoService = inject(RenovInformeDesfavorableConRequerimientoIlsService);

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
    this.renovInfDesfConRequerimientoService.actoAdmin$.subscribe(actoAdmin => { this.actoAdmin = actoAdmin });
    this.renovInfDesfConRequerimientoService.publicAccessId$.subscribe(publicAccessId => { this.publicAccessId = publicAccessId });
    this.renovInfDesfConRequerimientoService.signatureDocState$.subscribe(signatureDocState => { this.signatureDocState = signatureDocState });
    this.renovInfDesfConRequerimientoService.externalSignUrl$.subscribe(externalSignUrl => { this.externalSignUrl = externalSignUrl });
    this.renovInfDesfConRequerimientoService.sendedUserToSign$.subscribe(sendedUserToSign => { this.sendedUserToSign = sendedUserToSign });
    this.renovInfDesfConRequerimientoService.sendedDateToSign$.subscribe(sendedDateToSign => { this.sendedDateToSign = sendedDateToSign });
    this.renovInfDesfConRequerimientoService.pdfUrl$.subscribe(pdfUrl => { this.pdfUrl = pdfUrl });
    this.renovInfDesfConRequerimientoService.showPdfViewer$.subscribe(showPdfViewer => { this.showPdfViewer = showPdfViewer });
    this.renovInfDesfConRequerimientoService.faltanCampos$.subscribe(faltanCampos => { this.faltanCampos = faltanCampos });
    this.renovInfDesfConRequerimientoService.camposVacios$.subscribe(camposVacios => { this.camposVacios = camposVacios });
  }

  ngOnChanges(): void {
    this.renovInfDesfConRequerimientoService.init(this.expediente, this.form);
  }

  generateActoAdmin(): void {
    this.renovInfDesfConRequerimientoService.generateActoAdmin();
  }

  getActoAdminDetail(): void {
    this.renovInfDesfConRequerimientoService.getActoAdminDetail();
  }

  viewActoAdmin(): void {
    this.renovInfDesfConRequerimientoService.viewActoAdmin();
  }

  closeViewActoAdmin(): void {
    this.renovInfDesfConRequerimientoService.closeViewActoAdmin();
  }

  sendActoAdminToSign(): void {
    this.renovInfDesfConRequerimientoService.sendActoAdminToSign();
  }
}
