import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { PrDefinitivaFavorableAdrIsbaService } from '../../Services/adr-isba-actos-admin/7-pr-definitiva-favorable/pr-definitiva-favorable.service';

@Component({
  selector: 'app-pr-definitiva-favorable-adr-isba',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, MatExpansionModule, MatButtonModule],
  templateUrl: './pr-definitiva-favorable.component.html',
  styleUrl: './pr-definitiva-favorable.component.scss'
})
export class PrDefinitivaFavorableAdrIsbaComponent {
  private prDefinitivaFavorableService = inject(PrDefinitivaFavorableAdrIsbaService);

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

  get stateClassActAdmin7(): string {
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
    this.prDefinitivaFavorableService.actoAdmin$.subscribe(actoAdmin => { this.actoAdmin = actoAdmin });
    this.prDefinitivaFavorableService.publicAccessId$.subscribe(publicAccessId => { this.publicAccessId = publicAccessId });
    this.prDefinitivaFavorableService.signatureDocState$.subscribe(signatureDocState => { this.signatureDocState = signatureDocState });
    this.prDefinitivaFavorableService.externalSignUrl$.subscribe(externalSignUrl => { this.externalSignUrl = externalSignUrl });
    this.prDefinitivaFavorableService.sendedUserToSign$.subscribe(sendedUserToSign => { this.sendedUserToSign = sendedUserToSign });
    this.prDefinitivaFavorableService.sendedDateToSign$.subscribe(sendedDateToSign => { this.sendedDateToSign = sendedDateToSign });
    this.prDefinitivaFavorableService.pdfUrl$.subscribe(pdfUrl => { this.pdfUrl = pdfUrl });
    this.prDefinitivaFavorableService.showPdfViewer$.subscribe(showPdfViewer => { this.showPdfViewer = showPdfViewer });
    this.prDefinitivaFavorableService.faltanCampos$.subscribe(faltanCampos => { this.faltanCampos = faltanCampos });
    this.prDefinitivaFavorableService.camposVacios$.subscribe(camposVacios => { this.camposVacios = camposVacios });
  }

  ngOnChanges(): void {
    this.prDefinitivaFavorableService.init(this.expediente, false, this.form);
  }

  getActoAdminDetail(): void {
    this.prDefinitivaFavorableService.getActoAdminDetail();
  }

  generateActoAdmin(): void {
    this.prDefinitivaFavorableService.generateActoAdmin();
  }

  viewActoAdmin(): void {
    this.prDefinitivaFavorableService.viewActoAdmin();
  }

  closeViewActoAdmin(): void {
    this.prDefinitivaFavorableService.closeViewActoAdmin();
  }

  sendActoAdminToSign(): void {
    this.prDefinitivaFavorableService.sendActoAdminToSign();
  }
}
