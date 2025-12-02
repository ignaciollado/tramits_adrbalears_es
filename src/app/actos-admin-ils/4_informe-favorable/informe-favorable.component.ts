import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { InformeFavorableIlsService } from '../../Services/ils-actos-admin/4-informe-favorable/informe-favorable.service';

@Component({
  selector: 'app-informe-favorable-ils',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatExpansionModule, MatButtonModule],
  templateUrl: './informe-favorable.component.html',
  styleUrl: './informe-favorable.component.scss'
})
export class InformeFavorableIlsComponent {
  private informeFavorableService = inject(InformeFavorableIlsService);

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
    this.informeFavorableService.actoAdmin$.subscribe(actoAdmin => { this.actoAdmin = actoAdmin });
    this.informeFavorableService.publicAccessId$.subscribe(publicAccessId => { this.publicAccessId = publicAccessId });
    this.informeFavorableService.signatureDocState$.subscribe(signatureDocState => { this.signatureDocState = signatureDocState });
    this.informeFavorableService.externalSignUrl$.subscribe(externalSignUrl => { this.externalSignUrl = externalSignUrl });
    this.informeFavorableService.sendedUserToSign$.subscribe(sendedUserToSign => { this.sendedUserToSign = sendedUserToSign });
    this.informeFavorableService.sendedDateToSign$.subscribe(sendedDateToSign => { this.sendedDateToSign = sendedDateToSign });
    this.informeFavorableService.pdfUrl$.subscribe(pdfUrl => { this.pdfUrl = pdfUrl });
    this.informeFavorableService.showPdfViewer$.subscribe(showPdfViewer => { this.showPdfViewer = showPdfViewer });
    this.informeFavorableService.faltanCampos$.subscribe(faltanCampos => { this.faltanCampos = faltanCampos });
    this.informeFavorableService.camposVacios$.subscribe(camposVacios => { this.camposVacios = camposVacios });
  }

  ngOnChanges(): void {
    this.informeFavorableService.init(this.expediente, this.form);
  }

  getActoAdminDetail(): void {
    this.informeFavorableService.getActoAdminDetail();
  }

  generateActoAdmin(): void {
    this.informeFavorableService.generateActoAdmin();
  }


  viewActoAdmin(): void {
    this.informeFavorableService.viewActoAdmin();

  }

  closeViewActoAdmin(): void {
    this.informeFavorableService.closeViewActoAdmin();
  }

  sendActoAdminToSign(): void {
    this.informeFavorableService.sendActoAdminToSign();
  }
}
