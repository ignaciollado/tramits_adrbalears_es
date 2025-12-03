import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { ResolDenegacionConRequerimientoIlsService } from '../../Services/ils-actos-admin/6-resol-denegacion-con-requerimiento/resol-denegacion-con-requerimiento.service';

@Component({
  selector: 'app-resol-denegacion-con-requerimiento-ils',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatButtonModule, MatExpansionModule],
  templateUrl: './resol-denegacion-con-requerimiento.component.html',
  styleUrl: './resol-denegacion-con-requerimiento.component.scss'
})
export class ResolDenegacionConRequerimientoIlsComponent {
  private resolDenegacionConRequerimientoService = inject(ResolDenegacionConRequerimientoIlsService);

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
    this.resolDenegacionConRequerimientoService.actoAdmin$.subscribe(actoAdmin => { this.actoAdmin = actoAdmin });
    this.resolDenegacionConRequerimientoService.publicAccessId$.subscribe(publicAccessId => { this.publicAccessId = publicAccessId });
    this.resolDenegacionConRequerimientoService.signatureDocState$.subscribe(signatureDocState => { this.signatureDocState = signatureDocState });
    this.resolDenegacionConRequerimientoService.externalSignUrl$.subscribe(externalSignUrl => { this.externalSignUrl = externalSignUrl });
    this.resolDenegacionConRequerimientoService.sendedUserToSign$.subscribe(sendedUserToSign => { this.sendedUserToSign = sendedUserToSign });
    this.resolDenegacionConRequerimientoService.sendedDateToSign$.subscribe(sendedDateToSign => { this.sendedDateToSign = sendedDateToSign });
    this.resolDenegacionConRequerimientoService.pdfUrl$.subscribe(pdfUrl => { this.pdfUrl = pdfUrl });
    this.resolDenegacionConRequerimientoService.showPdfViewer$.subscribe(showPdfViewer => { this.showPdfViewer = showPdfViewer });
    this.resolDenegacionConRequerimientoService.faltanCampos$.subscribe(faltanCampos => { this.faltanCampos = faltanCampos });
    this.resolDenegacionConRequerimientoService.camposVacios$.subscribe(camposVacios => { this.camposVacios = camposVacios });
  }

  ngOnChanges(): void {
    this.resolDenegacionConRequerimientoService.init(this.expediente, this.form);
  }


  getActoAdminDetail(): void {
    this.resolDenegacionConRequerimientoService.getActoAdminDetail();
  }

  generateActoAdmin(): void {
    this.resolDenegacionConRequerimientoService.generateActoAdmin();
  }

  viewActoAdmin(): void {
    this.resolDenegacionConRequerimientoService.viewActoAdmin();
  }

  closeViewActoAdmin(): void {
    this.resolDenegacionConRequerimientoService.closeViewActoAdmin();
  }

  sendActoAdminToSign(): void {
    this.resolDenegacionConRequerimientoService.sendActoAdminToSign();
  }
}
