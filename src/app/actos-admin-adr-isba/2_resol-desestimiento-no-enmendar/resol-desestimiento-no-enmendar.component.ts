import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { ResolDesestimientoNoEnmendarAdrIsbaService } from '../../Services/adr-isba-actos-admin/2-resol-desestimiento-no-enmendar/resol-desestimiento-no-enmendar.service';

@Component({
  selector: 'app-resol-desestimiento-no-enmendar-adr-isba',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, MatExpansionModule, MatButtonModule],
  templateUrl: './resol-desestimiento-no-enmendar.component.html',
  styleUrl: './resol-desestimiento-no-enmendar.component.scss'
})
export class ResolDesestimientoNoEnmendarAdrIsbaComponent {
  private resolDesestimientoNoEnmendarService = inject(ResolDesestimientoNoEnmendarAdrIsbaService);

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

  get stateClassActAdmin2(): string {
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
    this.resolDesestimientoNoEnmendarService.actoAdmin$.subscribe(actoAdmin => { this.actoAdmin = actoAdmin });
    this.resolDesestimientoNoEnmendarService.publicAccessId$.subscribe(publicAccessId => { this.publicAccessId = publicAccessId });
    this.resolDesestimientoNoEnmendarService.signatureDocState$.subscribe(signatureDocState => { this.signatureDocState = signatureDocState });
    this.resolDesestimientoNoEnmendarService.externalSignUrl$.subscribe(externalSignUrl => { this.externalSignUrl = externalSignUrl });
    this.resolDesestimientoNoEnmendarService.sendedUserToSign$.subscribe(sendedUserToSign => { this.sendedUserToSign = sendedUserToSign });
    this.resolDesestimientoNoEnmendarService.sendedDateToSign$.subscribe(sendedDateToSign => { this.sendedDateToSign = sendedDateToSign });
    this.resolDesestimientoNoEnmendarService.pdfUrl$.subscribe(pdfUrl => { this.pdfUrl = pdfUrl });
    this.resolDesestimientoNoEnmendarService.showPdfViewer$.subscribe(showPdfViewer => { this.showPdfViewer = showPdfViewer });
    this.resolDesestimientoNoEnmendarService.faltanCampos$.subscribe(faltanCampos => { this.faltanCampos = faltanCampos });
    this.resolDesestimientoNoEnmendarService.camposVacios$.subscribe(camposVacios => { this.camposVacios = camposVacios });
  }

  ngOnChanges(): void {
    this.resolDesestimientoNoEnmendarService.init(this.expediente, this.form);
  }


  getActoAdminDetail(): void {
    this.resolDesestimientoNoEnmendarService.getActoAdminDetail();
  }

  generateActoAdmin(): void {
    this.resolDesestimientoNoEnmendarService.generateActoAdmin();
  }

  viewActoAdmin(): void {
    this.resolDesestimientoNoEnmendarService.viewActoAdmin();
  }

  closeViewActoAdmin(): void {
    this.resolDesestimientoNoEnmendarService.closeViewActoAdmin();
  }

  sendActoAdminToSign(): void {
    this.resolDesestimientoNoEnmendarService.sendActoAdminToSign();

  }
}