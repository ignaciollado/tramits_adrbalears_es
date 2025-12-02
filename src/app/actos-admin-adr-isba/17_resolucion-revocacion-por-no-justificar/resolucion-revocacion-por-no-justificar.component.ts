import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { ResRevocacionPorNoJustificarArdIsbaService } from '../../Services/adr-isba-actos-admin/17-res-revocacion-por-no-justificar/res-revocacion-por-no-justificar.service';

@Component({
  selector: 'app-resolucion-revocacion-por-no-justificar-adr-isba',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, MatExpansionModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './resolucion-revocacion-por-no-justificar.component.html',
  styleUrl: './resolucion-revocacion-por-no-justificar.component.scss'
})
export class ResolucionRevocacionPorNoJustificarAdrIsbaComponent {
  private resRevocNoJustificarService = inject(ResRevocacionPorNoJustificarArdIsbaService);
  private fb = inject(FormBuilder);

  formRevocacion!: FormGroup;
  noRevocationReasonText!: boolean;
  motivoResolucionRevocacionPorNoJustificar!: string;

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
  ) { };

  get stateClassActoAdmin17(): string {
    const map: Record<string, string> = {
      NOT_STARTED: 'req-state--not-started',
      IN_PROCESS: 'req-state--in-process',
      COMPLETED: 'req-state--completed',
      REJECTED: 'req-state--rejected',
    }

    return map[this.signatureDocState ?? ''] ?? 'req-state--not-started';
  }

  ngOnInit(): void {
    this.formRevocacion = this.fb.group({
      motivoResolucionRevocacionPorNoJustificar: [{ value: '', disabled: false }]
    });

    // BehaviorSubject
    this.resRevocNoJustificarService.actoAdmin$.subscribe(actoAdmin => { this.actoAdmin = actoAdmin })
    this.resRevocNoJustificarService.noRevocationReasonText$.subscribe(noRevocationReasonText => { this.noRevocationReasonText = noRevocationReasonText });
    this.resRevocNoJustificarService.publicAccessId$.subscribe(publicAccessId => { this.publicAccessId = publicAccessId });
    this.resRevocNoJustificarService.signatureDocState$.subscribe(signatureDocState => { this.signatureDocState = signatureDocState });
    this.resRevocNoJustificarService.externalSignUrl$.subscribe(externalSignUrl => { this.externalSignUrl = externalSignUrl });
    this.resRevocNoJustificarService.sendedUserToSign$.subscribe(sendedUserToSign => { this.sendedUserToSign = sendedUserToSign });
    this.resRevocNoJustificarService.sendedDateToSign$.subscribe(sendedDateToSign => { this.sendedDateToSign = sendedDateToSign });
    this.resRevocNoJustificarService.pdfUrl$.subscribe(pdfUrl => { this.pdfUrl = pdfUrl });
    this.resRevocNoJustificarService.showPdfViewer$.subscribe(showPdfViewer => { this.showPdfViewer = showPdfViewer });
    this.resRevocNoJustificarService.faltanCampos$.subscribe(faltanCampos => { this.faltanCampos = faltanCampos });
    this.resRevocNoJustificarService.camposVacios$.subscribe(camposVacios => { this.camposVacios = camposVacios });

  }

  ngOnChanges(): void {
    this.resRevocNoJustificarService.init(this.expediente, this.form);

    if (this.expediente && this.expediente.motivoResolucionRevocacionPorNoJustificar && this.formRevocacion) {
      this.formRevocacion.patchValue({
        motivoResolucionRevocacionPorNoJustificar: this.expediente.motivoResolucionRevocacionPorNoJustificar
      })
      this.noRevocationReasonText = false;
    }
  }

  saveReasonRevocation(): void {
    this.resRevocNoJustificarService.saveReasonRevocation(this.formRevocacion);
  }

  getActoAdminDetail(): void {
    this.resRevocNoJustificarService.getActoAdminDetail();
  }



  generateActoAdmin(): void {
    this.resRevocNoJustificarService.generateActoAdmin();
  }

  viewActoAdmin(): void {
    this.resRevocNoJustificarService.viewActoAdmin();
  }

  closeViewActoAdmin(): void {
    this.resRevocNoJustificarService.closeViewActoAdmin();
  }

  sendActoAdminToSign(): void {
    this.resRevocNoJustificarService.sendActoAdminToSign();
  }
}
