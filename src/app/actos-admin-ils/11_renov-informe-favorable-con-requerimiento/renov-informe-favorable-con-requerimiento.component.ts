import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { RenovInformeFavorableConRequerimientoIlsService } from '../../Services/ils-actos-admin/11-renov-informe-favorable-con-requerimiento/renov-informe-favorable-con-requerimiento.service';

@Component({
  selector: 'app-renov-informe-favorable-con-requerimiento-ils',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatButtonModule, MatExpansionModule],
  templateUrl: './renov-informe-favorable-con-requerimiento.component.html',
  styleUrl: './renov-informe-favorable-con-requerimiento.component.scss'
})
export class RenovInformeFavorableConRequerimientoIlsComponent {
  private renovInfFavConRequerimientoService = inject(RenovInformeFavorableConRequerimientoIlsService);

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
    this.renovInfFavConRequerimientoService.actoAdmin$.subscribe(actoAdmin => { this.actoAdmin = actoAdmin });
    this.renovInfFavConRequerimientoService.publicAccessId$.subscribe(publicAccessId => { this.publicAccessId = publicAccessId });
    this.renovInfFavConRequerimientoService.signatureDocState$.subscribe(signatureDocState => { this.signatureDocState = signatureDocState });
    this.renovInfFavConRequerimientoService.externalSignUrl$.subscribe(externalSignUrl => { this.externalSignUrl = externalSignUrl });
    this.renovInfFavConRequerimientoService.sendedUserToSign$.subscribe(sendedUserToSign => { this.sendedUserToSign = sendedUserToSign });
    this.renovInfFavConRequerimientoService.sendedDateToSign$.subscribe(sendedDateToSign => { this.sendedDateToSign = sendedDateToSign });
    this.renovInfFavConRequerimientoService.pdfUrl$.subscribe(pdfUrl => { this.pdfUrl = pdfUrl });
    this.renovInfFavConRequerimientoService.showPdfViewer$.subscribe(showPdfViewer => { this.showPdfViewer = showPdfViewer });
    this.renovInfFavConRequerimientoService.faltanCampos$.subscribe(faltanCampos => { this.faltanCampos = faltanCampos });
    this.renovInfFavConRequerimientoService.camposVacios$.subscribe(camposVacios => { this.camposVacios = camposVacios });
  }

  ngOnChanges(): void {
    this.renovInfFavConRequerimientoService.init(this.expediente, this.form);
  }

  generateActoAdmin(): void {
    this.renovInfFavConRequerimientoService.generateActoAdmin();
  }

  getActoAdminDetail(): void {
    this.renovInfFavConRequerimientoService.getActoAdminDetail();
  }

  viewActoAdmin(): void {
    this.renovInfFavConRequerimientoService.viewActoAdmin();

  }

  closeViewActoAdmin(): void {
    this.renovInfFavConRequerimientoService.closeViewActoAdmin();
  }


  sendActoAdminToSign(): void {
    this.renovInfFavConRequerimientoService.sendActoAdminToSign();
  }
}
