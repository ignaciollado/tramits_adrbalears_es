import { CommonModule } from "@angular/common";
import { Component, inject, Input } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { SafeResourceUrl } from "@angular/platform-browser";
import { TranslateModule } from "@ngx-translate/core";
import { RequerimientoIlsService } from "../../Services/ils-actos-admin/1-requerimiento/requerimiento.service";


@Component({
  selector: 'app-requerimiento-ils',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, MatExpansionModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './requerimiento.component.html',
  styleUrl: './requerimiento.component.scss'
})
export class RequerimientoIlsComponent {
  private requerimientoService = inject(RequerimientoIlsService);
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
  constructor() {
  }

  get stateClass(): string {
    const map: Record<string, string> = {
      NOT_STARTED: 'req-state--not-started',
      IN_PROCESS: 'req-state--in-process',
      COMPLETED: 'req-state--completed',
      REJECTED: 'req-state--rejected'
    };
    return map[this.signatureDocState ?? ''] ?? 'req-state--not-started';
  }

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

  ngOnChanges(): void {
    this.requerimientoService.init(this.expediente, this.form);

    if (this.expediente && this.expediente.motivoRequerimiento && this.formRequerimiento) {
      this.formRequerimiento.patchValue({
        motivoRequerimiento: this.expediente.motivoRequerimiento
      })
      this.noRequestReasonText = false;
    }
  }

  saveRequerimientoReason(): void {
    this.requerimientoService.saveReasonRequest(this.formRequerimiento);
  }

  getActoAdminDetail(): void {
    this.requerimientoService.getActoAdminDetail();
  }

  generateActoAdmin(): void {
    this.requerimientoService.generateActoAdmin();
  }

  viewActoAdmin(): void {
    this.requerimientoService.viewActoAdmin();
  }

  closeViewActoAdmin(): void {
    this.requerimientoService.closeViewActoAdmin();
  }

  sendActoAdminToSign(): void {
    this.requerimientoService.sendActoAdminToSign();
  }
}
