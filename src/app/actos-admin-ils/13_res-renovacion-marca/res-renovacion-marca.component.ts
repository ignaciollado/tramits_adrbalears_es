import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { ResRenovacionMarcaIlsService } from '../../Services/ils-actos-admin/13-res-renovacion-marca/res-renovacion-marca.service';

@Component({
  selector: 'app-res-renovacion-marca-ils',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatButtonModule, MatExpansionModule],
  templateUrl: './res-renovacion-marca.component.html',
  styleUrl: './res-renovacion-marca.component.scss'
})
export class ResRenovacionMarcaIlsComponent {
  private resRenovacionMarcaService = inject(ResRenovacionMarcaIlsService);

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
    this.resRenovacionMarcaService.actoAdmin$.subscribe(actoAdmin => { this.actoAdmin = actoAdmin });
    this.resRenovacionMarcaService.publicAccessId$.subscribe(publicAccessId => { this.publicAccessId = publicAccessId });
    this.resRenovacionMarcaService.signatureDocState$.subscribe(signatureDocState => { this.signatureDocState = signatureDocState });
    this.resRenovacionMarcaService.externalSignUrl$.subscribe(externalSignUrl => { this.externalSignUrl = externalSignUrl });
    this.resRenovacionMarcaService.sendedUserToSign$.subscribe(sendedUserToSign => { this.sendedUserToSign = sendedUserToSign });
    this.resRenovacionMarcaService.sendedDateToSign$.subscribe(sendedDateToSign => { this.sendedDateToSign = sendedDateToSign });
    this.resRenovacionMarcaService.pdfUrl$.subscribe(pdfUrl => { this.pdfUrl = pdfUrl });
    this.resRenovacionMarcaService.showPdfViewer$.subscribe(showPdfViewer => { this.showPdfViewer = showPdfViewer });
    this.resRenovacionMarcaService.faltanCampos$.subscribe(faltanCampos => { this.faltanCampos = faltanCampos });
    this.resRenovacionMarcaService.camposVacios$.subscribe(camposVacios => { this.camposVacios = camposVacios });
  }

  ngOnChanges(): void {
    this.resRenovacionMarcaService.init(this.expediente, this.form);
  }

  generateActoAdmin(): void {
    this.resRenovacionMarcaService.generateActoAdmin();
  }

  getActoAdminDetail(): void {
    this.resRenovacionMarcaService.getActoAdminDetail();
  }

  viewActoAdmin(): void {
    this.resRenovacionMarcaService.viewActoAdmin();

  }

  closeViewActoAdmin(): void {
    this.resRenovacionMarcaService.closeViewActoAdmin();
  }

  sendActoAdminToSign(): void {
    this.resRenovacionMarcaService.sendActoAdminToSign();
  }
}
