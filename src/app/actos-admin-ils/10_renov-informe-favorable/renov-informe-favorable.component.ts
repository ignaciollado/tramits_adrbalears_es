import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { RenovInformeFavorableIlsService } from '../../Services/ils-actos-admin/10-renov-informe-favorable/renov-informe-favorable.service';

@Component({
  selector: 'app-renov-informe-favorable-ils',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, MatButtonModule, TranslateModule],
  templateUrl: './renov-informe-favorable.component.html',
  styleUrl: './renov-informe-favorable.component.scss'
})
export class RenovInformeFavorableIlsComponent {
  private renovInfFavorableService = inject(RenovInformeFavorableIlsService);

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
    this.renovInfFavorableService.actoAdmin$.subscribe(actoAdmin => { this.actoAdmin = actoAdmin });
    this.renovInfFavorableService.publicAccessId$.subscribe(publicAccessId => { this.publicAccessId = publicAccessId });
    this.renovInfFavorableService.signatureDocState$.subscribe(signatureDocState => { this.signatureDocState = signatureDocState });
    this.renovInfFavorableService.externalSignUrl$.subscribe(externalSignUrl => { this.externalSignUrl = externalSignUrl });
    this.renovInfFavorableService.sendedUserToSign$.subscribe(sendedUserToSign => { this.sendedUserToSign = sendedUserToSign });
    this.renovInfFavorableService.sendedDateToSign$.subscribe(sendedDateToSign => { this.sendedDateToSign = sendedDateToSign });
    this.renovInfFavorableService.pdfUrl$.subscribe(pdfUrl => { this.pdfUrl = pdfUrl });
    this.renovInfFavorableService.showPdfViewer$.subscribe(showPdfViewer => { this.showPdfViewer = showPdfViewer });
    this.renovInfFavorableService.faltanCampos$.subscribe(faltanCampos => { this.faltanCampos = faltanCampos });
    this.renovInfFavorableService.camposVacios$.subscribe(camposVacios => { this.camposVacios = camposVacios });
  }

  ngOnChanges(): void {
    this.renovInfFavorableService.init(this.expediente, this.form);
  }


  generateActoAdmin(): void {
    this.renovInfFavorableService.generateActoAdmin();
  }

  getActoAdminDetail(): void {
    this.renovInfFavorableService.getActoAdminDetail();
  }

  viewActoAdmin(): void {
    this.renovInfFavorableService.viewActoAdmin();
  }

  closeViewActoAdmin(): void {
    this.renovInfFavorableService.closeViewActoAdmin();
  }


  sendActoAdminToSign(): void {
    this.renovInfFavorableService.sendActoAdminToSign();
  }
}
