import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { PrDefinitivaFavorableConRequerimientoAdrIsbaService } from '../../Services/adr-isba-actos-admin/8-pr-definitiva-favorable-con-requerimiento/pr-definitiva-favorable-con-requerimiento.service';

@Component({
  selector: 'app-pr-definitiva-favorable-con-requerimiento-adr-isba',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, MatExpansionModule, MatButtonModule],
  templateUrl: './pr-definitiva-favorable-con-requerimiento.component.html',
  styleUrl: './pr-definitiva-favorable-con-requerimiento.component.scss'
})

export class PrDefinitivaFavorableConRequerimientoAdrIsbaComponent {
  private prDefinitivaFavorableConRequerimientoService = inject(PrDefinitivaFavorableConRequerimientoAdrIsbaService);

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

  get stateClassActAdmin8(): string {
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
    this.prDefinitivaFavorableConRequerimientoService.actoAdmin$.subscribe(actoAdmin => { this.actoAdmin = actoAdmin });
    this.prDefinitivaFavorableConRequerimientoService.publicAccessId$.subscribe(publicAccessId => { this.publicAccessId = publicAccessId });
    this.prDefinitivaFavorableConRequerimientoService.signatureDocState$.subscribe(signatureDocState => { this.signatureDocState = signatureDocState });
    this.prDefinitivaFavorableConRequerimientoService.externalSignUrl$.subscribe(externalSignUrl => { this.externalSignUrl = externalSignUrl });
    this.prDefinitivaFavorableConRequerimientoService.sendedUserToSign$.subscribe(sendedUserToSign => { this.sendedUserToSign = sendedUserToSign });
    this.prDefinitivaFavorableConRequerimientoService.sendedDateToSign$.subscribe(sendedDateToSign => { this.sendedDateToSign = sendedDateToSign });
    this.prDefinitivaFavorableConRequerimientoService.pdfUrl$.subscribe(pdfUrl => { this.pdfUrl = pdfUrl });
    this.prDefinitivaFavorableConRequerimientoService.showPdfViewer$.subscribe(showPdfViewer => { this.showPdfViewer = showPdfViewer });
    this.prDefinitivaFavorableConRequerimientoService.faltanCampos$.subscribe(faltanCampos => { this.faltanCampos = faltanCampos });
    this.prDefinitivaFavorableConRequerimientoService.camposVacios$.subscribe(camposVacios => { this.camposVacios = camposVacios });
  }

  ngOnChanges(): void {
    this.prDefinitivaFavorableConRequerimientoService.init(this.expediente, false, this.form);
  }

  getActoAdminDetail(): void {
    this.prDefinitivaFavorableConRequerimientoService.getActoAdminDetail();
  }

  generateActoAdmin(): void {
    this.prDefinitivaFavorableConRequerimientoService.generateActoAdmin();
  }


  viewActoAdmin(): void {
    this.prDefinitivaFavorableConRequerimientoService.viewActoAdmin();
  }

  closeViewActoAdmin(): void {
    this.prDefinitivaFavorableConRequerimientoService.closeViewActoAdmin();
  }

  sendActoAdminToSign(): void {
    this.prDefinitivaFavorableConRequerimientoService.sendActoAdminToSign();
  }
}
