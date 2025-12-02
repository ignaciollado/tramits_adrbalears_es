import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { ResolucionConcesionAdrIsbaService } from '../../Services/adr-isba-actos-admin/9-resolucion-concesion/resolucion-concesion.service';

@Component({
  selector: 'app-resolucion-concesion-adr-isba',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, MatExpansionModule, MatButtonModule],
  templateUrl: './resolucion-concesion.component.html',
  styleUrl: './resolucion-concesion.component.scss'
})
export class ResolucionConcesionAdrIsbaComponent {
  private resolucionConcesionService = inject(ResolucionConcesionAdrIsbaService)

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

  get stateClassActAdmin9(): string {
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
    this.resolucionConcesionService.actoAdmin$.subscribe(actoAdmin => { this.actoAdmin = actoAdmin });
    this.resolucionConcesionService.publicAccessId$.subscribe(publicAccessId => { this.publicAccessId = publicAccessId });
    this.resolucionConcesionService.signatureDocState$.subscribe(signatureDocState => { this.signatureDocState = signatureDocState });
    this.resolucionConcesionService.externalSignUrl$.subscribe(externalSignUrl => { this.externalSignUrl = externalSignUrl });
    this.resolucionConcesionService.sendedUserToSign$.subscribe(sendedUserToSign => { this.sendedUserToSign = sendedUserToSign });
    this.resolucionConcesionService.sendedDateToSign$.subscribe(sendedDateToSign => { this.sendedDateToSign = sendedDateToSign });
    this.resolucionConcesionService.pdfUrl$.subscribe(pdfUrl => { this.pdfUrl = pdfUrl });
    this.resolucionConcesionService.showPdfViewer$.subscribe(showPdfViewer => { this.showPdfViewer = showPdfViewer });
    this.resolucionConcesionService.faltanCampos$.subscribe(faltanCampos => { this.faltanCampos = faltanCampos });
    this.resolucionConcesionService.camposVacios$.subscribe(camposVacios => { this.camposVacios = camposVacios });
  }

  ngOnChanges(): void {
    this.resolucionConcesionService.init(this.expediente, this.form, false);
  }

  getActoAdminDetail(): void {
    this.resolucionConcesionService.getActoAdminDetail();
  }

  generateActoAdmin(): void {
    this.resolucionConcesionService.generateActoAdmin();
  }

  viewActoAdmin(): void {
    this.resolucionConcesionService.viewActoAdmin();
  }

  closeViewActoAdmin(): void {
    this.resolucionConcesionService.closeViewActoAdmin();
  }

  sendActoAdminToSign(): void {
    this.resolucionConcesionService.sendActoAdminToSign();
  }
}
