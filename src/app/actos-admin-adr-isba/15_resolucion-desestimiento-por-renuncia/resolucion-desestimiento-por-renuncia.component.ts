import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { ResolucionDesestimientoPorRenunciaAdrIsbaService } from '../../Services/adr-isba-actos-admin/15-resolucion-desestimiento-por-renuncia/resolucion-desestimiento-por-renuncia.service';

@Component({
  selector: 'app-resolucion-desestimiento-por-renuncia-adr-isba',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, MatExpansionModule, MatButtonModule],
  templateUrl: './resolucion-desestimiento-por-renuncia.component.html',
  styleUrl: './resolucion-desestimiento-por-renuncia.component.scss'
})
export class ResolucionDesestimientoPorRenunciaAdrIsbaComponent {
  private resolDesestimientoPorRenunciaService = inject(ResolucionDesestimientoPorRenunciaAdrIsbaService);
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

  get stateClassActAdmin15(): string {
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
    this.resolDesestimientoPorRenunciaService.actoAdmin$.subscribe(actoAdmin => { this.actoAdmin = actoAdmin });
    this.resolDesestimientoPorRenunciaService.publicAccessId$.subscribe(publicAccessId => { this.publicAccessId = publicAccessId });
    this.resolDesestimientoPorRenunciaService.signatureDocState$.subscribe(signatureDocState => { this.signatureDocState = signatureDocState });
    this.resolDesestimientoPorRenunciaService.externalSignUrl$.subscribe(externalSignUrl => { this.externalSignUrl = externalSignUrl });
    this.resolDesestimientoPorRenunciaService.sendedUserToSign$.subscribe(sendedUserToSign => { this.sendedUserToSign = sendedUserToSign });
    this.resolDesestimientoPorRenunciaService.sendedDateToSign$.subscribe(sendedDateToSign => { this.sendedDateToSign = sendedDateToSign });
    this.resolDesestimientoPorRenunciaService.pdfUrl$.subscribe(pdfUrl => { this.pdfUrl = pdfUrl });
    this.resolDesestimientoPorRenunciaService.showPdfViewer$.subscribe(showPdfViewer => { this.showPdfViewer = showPdfViewer });
    this.resolDesestimientoPorRenunciaService.faltanCampos$.subscribe(faltanCampos => { this.faltanCampos = faltanCampos });
    this.resolDesestimientoPorRenunciaService.camposVacios$.subscribe(camposVacios => { this.camposVacios = camposVacios });
  }

  ngOnChanges(): void {
    this.resolDesestimientoPorRenunciaService.init(this.expediente, this.form);
  }

  getActoAdminDetail(): void {
    this.resolDesestimientoPorRenunciaService.getActoAdminDetail();
  }

  generateActoAdmin(): void {
    this.resolDesestimientoPorRenunciaService.generateActoAdmin();
  }

  viewActoAdmin(): void {
    this.resolDesestimientoPorRenunciaService.viewActoAdmin();
  }

  closeViewActoAdmin(): void {
    this.resolDesestimientoPorRenunciaService.closeViewActoAdmin();
  }

  sendActoAdminToSign(): void {
    this.resolDesestimientoPorRenunciaService.sendActoAdminToSign();
  }
}
