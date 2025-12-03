import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { ResolConcesionAdhesionIlsService } from '../../Services/ils-actos-admin/7-resol-concesion-adhesion/resol-concesion-adhesion.service';

@Component({
  selector: 'app-resol-concesion-adhesion-ils',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatButtonModule, MatExpansionModule],
  templateUrl: './resol-concesion-adhesion.component.html',
  styleUrl: './resol-concesion-adhesion.component.scss'
})

export class ResolConcesionAdhesionIlsComponent {
  private resolConcesionAdhesionService = inject(ResolConcesionAdhesionIlsService);

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
    this.resolConcesionAdhesionService.actoAdmin$.subscribe(actoAdmin => { this.actoAdmin = actoAdmin });
    this.resolConcesionAdhesionService.publicAccessId$.subscribe(publicAccessId => { this.publicAccessId = publicAccessId });
    this.resolConcesionAdhesionService.signatureDocState$.subscribe(signatureDocState => { this.signatureDocState = signatureDocState });
    this.resolConcesionAdhesionService.externalSignUrl$.subscribe(externalSignUrl => { this.externalSignUrl = externalSignUrl });
    this.resolConcesionAdhesionService.sendedUserToSign$.subscribe(sendedUserToSign => { this.sendedUserToSign = sendedUserToSign });
    this.resolConcesionAdhesionService.sendedDateToSign$.subscribe(sendedDateToSign => { this.sendedDateToSign = sendedDateToSign });
    this.resolConcesionAdhesionService.pdfUrl$.subscribe(pdfUrl => { this.pdfUrl = pdfUrl });
    this.resolConcesionAdhesionService.showPdfViewer$.subscribe(showPdfViewer => { this.showPdfViewer = showPdfViewer });
    this.resolConcesionAdhesionService.faltanCampos$.subscribe(faltanCampos => { this.faltanCampos = faltanCampos });
    this.resolConcesionAdhesionService.camposVacios$.subscribe(camposVacios => { this.camposVacios = camposVacios });
  }

  ngOnChanges(): void {
    this.resolConcesionAdhesionService.init(this.expediente, this.form);
  }

  generateActoAdmin(): void {
    this.resolConcesionAdhesionService.generateActoAdmin();
  }


  getActoAdminDetail(): void {
    this.resolConcesionAdhesionService.getActoAdminDetail();
  }

  viewActoAdmin(): void {
    this.resolConcesionAdhesionService.viewActoAdmin();
  }

  closeViewActoAdmin(): void {
    this.resolConcesionAdhesionService.closeViewActoAdmin();
  }

  sendActoAdminToSign(): void {
    this.resolConcesionAdhesionService.sendActoAdminToSign();
  }
}
