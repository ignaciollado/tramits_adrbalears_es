import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { InformeFavorableConRequerimientoIlsService } from '../../Services/ils-actos-admin/3-informe-favorable-con-requerimiento/informe-favorable-con-requerimiento.service';

@Component({
  selector: 'app-informe-favorable-con-requerimiento-ils',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatButtonModule, MatExpansionModule],
  templateUrl: './informe-favorable-con-requerimiento.component.html',
  styleUrl: './informe-favorable-con-requerimiento.component.scss'
})
export class InformeFavorableConRequerimientoIlsComponent {
  private informeFavorableConRequerimientoService = inject(InformeFavorableConRequerimientoIlsService);

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
    this.informeFavorableConRequerimientoService.actoAdmin$.subscribe(actoAdmin => { this.actoAdmin = actoAdmin });
    this.informeFavorableConRequerimientoService.publicAccessId$.subscribe(publicAccessId => { this.publicAccessId = publicAccessId });
    this.informeFavorableConRequerimientoService.signatureDocState$.subscribe(signatureDocState => { this.signatureDocState = signatureDocState });
    this.informeFavorableConRequerimientoService.externalSignUrl$.subscribe(externalSignUrl => { this.externalSignUrl = externalSignUrl });
    this.informeFavorableConRequerimientoService.sendedUserToSign$.subscribe(sendedUserToSign => { this.sendedUserToSign = sendedUserToSign });
    this.informeFavorableConRequerimientoService.sendedDateToSign$.subscribe(sendedDateToSign => { this.sendedDateToSign = sendedDateToSign });
    this.informeFavorableConRequerimientoService.pdfUrl$.subscribe(pdfUrl => { this.pdfUrl = pdfUrl });
    this.informeFavorableConRequerimientoService.showPdfViewer$.subscribe(showPdfViewer => { this.showPdfViewer = showPdfViewer });
    this.informeFavorableConRequerimientoService.faltanCampos$.subscribe(faltanCampos => { this.faltanCampos = faltanCampos });
    this.informeFavorableConRequerimientoService.camposVacios$.subscribe(camposVacios => { this.camposVacios = camposVacios });
  }

  ngOnChanges(): void {
    this.informeFavorableConRequerimientoService.init(this.expediente, this.form);

  }


  getActoAdminDetail(): void {
    this.informeFavorableConRequerimientoService.getActoAdminDetail();

  }

  generateActoAdmin(): void {
    this.informeFavorableConRequerimientoService.generateActoAdmin();
  }


  viewActoAdmin(): void {
    this.informeFavorableConRequerimientoService.viewActoAdmin();
  }

  closeViewActoAdmin(): void {
    this.informeFavorableConRequerimientoService.closeViewActoAdmin();
  }


  sendActoAdminToSign(): void {
    this.informeFavorableConRequerimientoService.sendActoAdminToSign();
  }
}


