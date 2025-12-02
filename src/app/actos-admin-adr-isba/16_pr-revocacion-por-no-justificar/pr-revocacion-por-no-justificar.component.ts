import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { PrRevocacionPorNoJustificarAdrIsbaService } from '../../Services/adr-isba-actos-admin/16-pr-revocacion-por-no-justificar/pr-revocacion-por-no-justificar.service';

@Component({
  selector: 'app-pr-revocacion-por-no-justificar-adr-isba',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, MatExpansionModule, MatButtonModule],
  templateUrl: './pr-revocacion-por-no-justificar.component.html',
  styleUrl: './pr-revocacion-por-no-justificar.component.scss'
})
export class PrRevocacionPorNoJustificarAdrIsbaComponent {
    private prRevPorNoJustificarService = inject(PrRevocacionPorNoJustificarAdrIsbaService);
  
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

  get stateClassActAdmin16(): string {
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
    this.prRevPorNoJustificarService.actoAdmin$.subscribe(actoAdmin => { this.actoAdmin = actoAdmin });
    this.prRevPorNoJustificarService.publicAccessId$.subscribe(publicAccessId => { this.publicAccessId = publicAccessId });
    this.prRevPorNoJustificarService.signatureDocState$.subscribe(signatureDocState => { this.signatureDocState = signatureDocState });
    this.prRevPorNoJustificarService.externalSignUrl$.subscribe(externalSignUrl => { this.externalSignUrl = externalSignUrl });
    this.prRevPorNoJustificarService.sendedUserToSign$.subscribe(sendedUserToSign => { this.sendedUserToSign = sendedUserToSign });
    this.prRevPorNoJustificarService.sendedDateToSign$.subscribe(sendedDateToSign => { this.sendedDateToSign = sendedDateToSign });
    this.prRevPorNoJustificarService.pdfUrl$.subscribe(pdfUrl => { this.pdfUrl = pdfUrl });
    this.prRevPorNoJustificarService.showPdfViewer$.subscribe(showPdfViewer => { this.showPdfViewer = showPdfViewer });
    this.prRevPorNoJustificarService.faltanCampos$.subscribe(faltanCampos => { this.faltanCampos = faltanCampos });
    this.prRevPorNoJustificarService.camposVacios$.subscribe(camposVacios => { this.camposVacios = camposVacios });
  }

  ngOnChanges(): void {
    this.prRevPorNoJustificarService.init(this.expediente, this.form);
  }

  getActoAdminDetail(): void {
    this.prRevPorNoJustificarService.getActoAdminDetail();
  }

  generateActoAdmin(): void {
    this.prRevPorNoJustificarService.generateActoAdmin();
  }

  viewActoAdmin(): void {
    this.prRevPorNoJustificarService.viewActoAdmin();
  }

  closeViewActoAdmin(): void {
    this.prRevPorNoJustificarService.closeViewActoAdmin();
  }

  sendActoAdminToSign(): void {
    this.prRevPorNoJustificarService.sendActoAdminToSign();
  }
}
