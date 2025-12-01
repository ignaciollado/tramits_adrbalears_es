import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { RequerimientoAdrIsbaService } from '../../Services/adr-isba-actos-admin/1-requerimiento/requerimiento.service';

@Component({
  selector: 'app-requerimiento-adr-isba',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, MatExpansionModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './requerimiento.component.html',
  styleUrl: './requerimiento.component.scss'
})
export class RequerimientoAdrIsbaComponent {
  private requerimientoService = inject(RequerimientoAdrIsbaService)
  private fb = inject(FormBuilder);

  formRequerimiento!: FormGroup;
  noRequestReasonText!: boolean;
  motivoRequerimiento!: string;

  signatureDocState!: string;
  actoAdmin!: boolean;
  publicAccessId!: string;
  externalSignUrl!: string;
  sendedUserToSign!: string;
  sendedDateToSign!: Date;
  pdfUrl: SafeResourceUrl | null = null;
  showPdfViewer!: boolean;

  @Input() expediente!: any;
  @Input() form!: FormGroup;
  constructor(
  ) { };

  get stateClass(): string {
    const map: Record<string, string> = {
      NOT_STARTED: 'req-state--not-started',
      IN_PROCESS: 'req-state--in-process',
      COMPLETED: 'req-state--completed',
      REJECTED: 'req-state--rejected',
    }

    return map[this.signatureDocState ?? ''] ?? 'req-state--not-started';
  }

  // Servirá para inicializar el formulario, patchear valor si ya existe y vincular los BehaviourSubject con las propiedades del template
  ngOnInit(): void {
    this.formRequerimiento = this.fb.group({
      motivoRequerimiento: [{ value: '', disabled: false }]
    })


    // BehaviorSubject
    this.requerimientoService.actoAdmin$.subscribe(actoAdmin => { this.actoAdmin = actoAdmin })
    this.requerimientoService.noRequestReasonText$.subscribe(noRequestReasonText => { this.noRequestReasonText = noRequestReasonText });
    this.requerimientoService.publicAccessId$.subscribe(publicAccessId => { this.publicAccessId = publicAccessId });
    this.requerimientoService.signatureDocState$.subscribe(signatureDocState => { this.signatureDocState = signatureDocState });
    this.requerimientoService.externalSignUrl$.subscribe(externalSignUrl => { this.externalSignUrl = externalSignUrl });
    this.requerimientoService.sendedUserToSign$.subscribe(sendedUserToSign => { this.sendedUserToSign = sendedUserToSign });
    this.requerimientoService.sendedDateToSign$.subscribe(sendedDateToSign => { this.sendedDateToSign = sendedDateToSign });
    this.requerimientoService.pdfUrl$.subscribe(pdfUrl => { this.pdfUrl = pdfUrl });
    this.requerimientoService.showPdfViewer$.subscribe(showPdfViewer => { this.showPdfViewer = showPdfViewer });
  }

  // Inicialización del servicio y patcheo de datos
  ngOnChanges(): void {
    this.requerimientoService.init(this.expediente, this.form);

    if (this.expediente && this.expediente.motivoRequerimiento && this.formRequerimiento) {
      this.formRequerimiento.patchValue({
        motivoRequerimiento: this.expediente.motivoRequerimiento
      })
      this.noRequestReasonText = false;
    }
  }

  // Refactorizado
  saveReasonRequest(): void {
    this.requerimientoService.saveReasonRequest(this.formRequerimiento);
  }

  // Refactorizado
  getActoAdminDetail() {
    this.requerimientoService.getActoAdminDetail();
  }

  // Refactorizado
  generateActoAdmin(): void {
    this.requerimientoService.generateActoAdmin();
  }

  // Refactorizado
  viewActoAdmin() {
    this.requerimientoService.viewActoAdmin();
  }

  // Refactorizado
  closeViewActoAdmin() {
    this.requerimientoService.closeViewActoAdmin();
  }

  // Refactorizado
  sendActoAdminToSign(): void {
    this.requerimientoService.sendActoAdminToSign();
  }

}
