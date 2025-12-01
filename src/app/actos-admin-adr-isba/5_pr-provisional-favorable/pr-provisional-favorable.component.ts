import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { PrProvisionalFavorableAdrIsbaService } from '../../Services/adr-isba-actos-admin/5-pr-provisional-favorable/pr-provisional-favorable.service';

@Component({
  selector: 'app-pr-provisional-favorable-adr-isba',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, MatExpansionModule, MatButtonModule],
  templateUrl: './pr-provisional-favorable.component.html',
  styleUrl: './pr-provisional-favorable.component.scss'
})
export class PrProvisionalFavorableAdrIsbaComponent {
  private prProvisionalFavorableService = inject(PrProvisionalFavorableAdrIsbaService);

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

  get stateClassActAdmin5(): string {
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
    this.prProvisionalFavorableService.actoAdmin$.subscribe(actoAdmin => { this.actoAdmin = actoAdmin });
    this.prProvisionalFavorableService.publicAccessId$.subscribe(publicAccessId => { this.publicAccessId = publicAccessId });
    this.prProvisionalFavorableService.signatureDocState$.subscribe(signatureDocState => { this.signatureDocState = signatureDocState });
    this.prProvisionalFavorableService.externalSignUrl$.subscribe(externalSignUrl => { this.externalSignUrl = externalSignUrl });
    this.prProvisionalFavorableService.sendedUserToSign$.subscribe(sendedUserToSign => { this.sendedUserToSign = sendedUserToSign });
    this.prProvisionalFavorableService.sendedDateToSign$.subscribe(sendedDateToSign => { this.sendedDateToSign = sendedDateToSign });
    this.prProvisionalFavorableService.pdfUrl$.subscribe(pdfUrl => { this.pdfUrl = pdfUrl });
    this.prProvisionalFavorableService.showPdfViewer$.subscribe(showPdfViewer => { this.showPdfViewer = showPdfViewer });
    this.prProvisionalFavorableService.faltanCampos$.subscribe(faltanCampos => { this.faltanCampos = faltanCampos });
    this.prProvisionalFavorableService.camposVacios$.subscribe(camposVacios => { this.camposVacios = camposVacios });
  }

  ngOnChanges(): void {
    this.prProvisionalFavorableService.init(this.expediente, this.form);
  }

  getActoAdminDetail(): void {
    this.prProvisionalFavorableService.getActoAdminDetail();
  }

  generateActoAdmin(): void {
    this.prProvisionalFavorableService.generateActoAdmin();
  }

  viewActoAdmin(): void {
    this.prProvisionalFavorableService.viewActoAdmin();
  }

  closeViewActoAdmin(): void {
    this.prProvisionalFavorableService.closeViewActoAdmin();
  }

  sendActoAdminToSign(): void {
    this.prProvisionalFavorableService.sendActoAdminToSign();
  }
}
