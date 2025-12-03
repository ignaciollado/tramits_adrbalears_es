import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { ResRenovacionMarcaConRequerimientoIlsService } from '../../Services/ils-actos-admin/14-res-renovacion-marca-con-requerimiento/res-renovacion-marca-con-requerimiento.service';

@Component({
  selector: 'app-res-renovacion-marca-con-requerimiento-ils',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatExpansionModule, TranslateModule],
  templateUrl: './res-renovacion-marca-con-requerimiento.component.html',
  styleUrl: './res-renovacion-marca-con-requerimiento.component.scss'
})
export class ResRenovacionMarcaConRequerimientoIlsComponent {
private resRenovMarcaConRequerimientoService = inject(ResRenovacionMarcaConRequerimientoIlsService);

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
    this.resRenovMarcaConRequerimientoService.actoAdmin$.subscribe(actoAdmin => { this.actoAdmin = actoAdmin });
    this.resRenovMarcaConRequerimientoService.publicAccessId$.subscribe(publicAccessId => { this.publicAccessId = publicAccessId });
    this.resRenovMarcaConRequerimientoService.signatureDocState$.subscribe(signatureDocState => { this.signatureDocState = signatureDocState });
    this.resRenovMarcaConRequerimientoService.externalSignUrl$.subscribe(externalSignUrl => { this.externalSignUrl = externalSignUrl });
    this.resRenovMarcaConRequerimientoService.sendedUserToSign$.subscribe(sendedUserToSign => { this.sendedUserToSign = sendedUserToSign });
    this.resRenovMarcaConRequerimientoService.sendedDateToSign$.subscribe(sendedDateToSign => { this.sendedDateToSign = sendedDateToSign });
    this.resRenovMarcaConRequerimientoService.pdfUrl$.subscribe(pdfUrl => { this.pdfUrl = pdfUrl });
    this.resRenovMarcaConRequerimientoService.showPdfViewer$.subscribe(showPdfViewer => { this.showPdfViewer = showPdfViewer });
    this.resRenovMarcaConRequerimientoService.faltanCampos$.subscribe(faltanCampos => { this.faltanCampos = faltanCampos });
    this.resRenovMarcaConRequerimientoService.camposVacios$.subscribe(camposVacios => { this.camposVacios = camposVacios });
  }

  ngOnChanges(): void {
    this.resRenovMarcaConRequerimientoService.init(this.expediente, this.form);
  }

  generateActoAdmin(): void {
    this.resRenovMarcaConRequerimientoService.generateActoAdmin();

  }

  getActoAdminDetail(): void {
    this.resRenovMarcaConRequerimientoService.getActoAdminDetail();
  }

  viewActoAdmin(): void {
    this.resRenovMarcaConRequerimientoService.viewActoAdmin();

  }

  closeViewActoAdmin(): void {
    this.resRenovMarcaConRequerimientoService.closeViewActoAdmin();

  }


  sendActoAdminToSign(): void {
    this.resRenovMarcaConRequerimientoService.sendActoAdminToSign();
  }
}
