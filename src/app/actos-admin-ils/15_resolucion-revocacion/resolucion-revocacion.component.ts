import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { ResolucionRevocacionIlsService } from '../../Services/ils-actos-admin/15-resolucion-revocacion/resolucion-revocacion.service';

@Component({
  selector: 'app-resolucion-revocacion-ils',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatButtonModule, MatExpansionModule],
  templateUrl: './resolucion-revocacion.component.html',
  styleUrl: './resolucion-revocacion.component.scss'
})
export class ResolucionRevocacionIlsComponent {
  private resRevocacionService = inject(ResolucionRevocacionIlsService);

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
  constructor() {}

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
    this.resRevocacionService.actoAdmin$.subscribe(actoAdmin => { this.actoAdmin = actoAdmin });
    this.resRevocacionService.publicAccessId$.subscribe(publicAccessId => { this.publicAccessId = publicAccessId });
    this.resRevocacionService.signatureDocState$.subscribe(signatureDocState => { this.signatureDocState = signatureDocState });
    this.resRevocacionService.externalSignUrl$.subscribe(externalSignUrl => { this.externalSignUrl = externalSignUrl });
    this.resRevocacionService.sendedUserToSign$.subscribe(sendedUserToSign => { this.sendedUserToSign = sendedUserToSign });
    this.resRevocacionService.sendedDateToSign$.subscribe(sendedDateToSign => { this.sendedDateToSign = sendedDateToSign });
    this.resRevocacionService.pdfUrl$.subscribe(pdfUrl => { this.pdfUrl = pdfUrl });
    this.resRevocacionService.showPdfViewer$.subscribe(showPdfViewer => { this.showPdfViewer = showPdfViewer });
    this.resRevocacionService.faltanCampos$.subscribe(faltanCampos => { this.faltanCampos = faltanCampos });
    this.resRevocacionService.camposVacios$.subscribe(camposVacios => { this.camposVacios = camposVacios });
  }

  ngOnChanges(): void {
    this.resRevocacionService.init(this.expediente, this.form);
  }

  generateActoAdmin(): void {
    this.resRevocacionService.generateActoAdmin();
  }

  getActoAdminDetail(): void {
    this.resRevocacionService.getActoAdminDetail();
  }

  viewActoAdmin(): void {
    this.resRevocacionService.viewActoAdmin();
  }

  closeViewActoAdmin(): void {
    this.resRevocacionService.closeViewActoAdmin();
  }


  sendActoAdminToSign(): void {
    this.resRevocacionService.sendActoAdminToSign();
  }


}
