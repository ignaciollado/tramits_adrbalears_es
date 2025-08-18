import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { ExpedienteService } from '../../Services/expediente.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DocumentoGeneradoDTO } from '../../Models/documentos-generados-dto';
import { SignatureResponse } from '../../Models/signature.dto';
import { CommonService } from '../../Services/common.service';
import { ViafirmaService } from '../../Services/viafirma.service';
import { DocumentosGeneradosService } from '../../Services/documentos-generados.service';
import { ActoAdministrativoService } from '../../Services/acto-administrativo.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import jsPDF from 'jspdf';
import { DocSignedDTO } from '../../Models/docsigned.dto';

@Component({
  selector: 'app-requerimiento-ils',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, MatExpansionModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './requerimiento.component.html',
  styleUrl: './requerimiento.component.scss'
})
export class RequerimientoIlsComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private expedienteService = inject(ExpedienteService);
  formRequerimiento!: FormGroup;
  noRequestReasonText: boolean = true;

  userLoginEmail: string = "";
  signatureDocState: string = "";
  reqGenerado: boolean = false;
  nifDocGenerado: string = "";
  timeStampDocgenerado: string = "";
  nameDocGenerado: string = "";
  lastInsertId: number | undefined;
  publicAccessId: string = "";
  externalSignUrl: string = "";
  sendedUserToSign: string = "";
  sendedDateToSign!: Date;
  pdfUrl: SafeResourceUrl | null = null;
  showPdfViewer: boolean = false;
  showImageViewer: boolean = false;
  codigoSIAConvo: string = "en bbdd de la convo y de la línea de ayudas";
  docGeneradoInsert: DocumentoGeneradoDTO = {
    id_sol: 0,
    cifnif_propietario: '',
    convocatoria: '',
    name: '',
    type: '',
    created_at: '',
    tipo_tramite: '',
    corresponde_documento: '',
    selloDeTiempo: '',
    publicAccessId: ''
  };
  response?: SignatureResponse;
  loading: boolean = false;
  error?: string;
  ceoEmail: string = "nachollv@hotmail.com";

  @Input() signedBy!: string;
  @Input() actualID!: number;
  @Input() actualIdExp!: number;
  @Input() actualNif!: string;
  @Input() actualConvocatoria!: number;
  @Input() actualTipoTramite!: string;
  @Input() actualEmpresa!: string;
  @Input() motivoRequerimiento!: string;

  constructor(
    private commonService: CommonService, private sanitizer: DomSanitizer,
    private viafirmaService: ViafirmaService, private documentosGeneradosService: DocumentosGeneradosService,
    private actoAdminService: ActoAdministrativoService, private jwtHelper: JwtHelperService
  ) { this.userLoginEmail = sessionStorage.getItem('tramits_user_email') || ""; };

  get stateClass(): string {
    const map: Record<string, string> = {
      NOT_STARTED: 'req-state--not-started',
      IN_PROCESS: 'req-state--in-process',
      COMPLETED: 'req-state--completed',
      REJECTED: 'req-state--rejected',
    }
    return map[this.signatureDocState ?? ''] ?? 'req-state--not-started'
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.tieneTodosLosValores()) {
      this.getActoAdminDetail();
    }

    if (this.formRequerimiento && this.motivoRequerimiento) {
      this.formRequerimiento.get('motivoRequerimiento')?.setValue(this.motivoRequerimiento);
    }
  }

  private tieneTodosLosValores(): boolean {
    return (
      this.actualID != null &&
      this.actualIdExp != null &&
      !!this.actualNif && this.actualConvocatoria != null &&
      !!this.actualTipoTramite
    );
  }

  ngOnInit(): void {
    this.formRequerimiento = this.fb.group({
      motivoRequerimiento: [{value: '', disabled: false}]
    });
  }

  getActoAdminDetail() {
    this.documentosGeneradosService.getDocumentosGenerados(this.actualID, this.actualNif, this.actualConvocatoria, 'doc_requeriment')
    .subscribe({
      next: (docGenerado: DocumentoGeneradoDTO[]) => {
        if (docGenerado.length === 1) {
          this.reqGenerado = true;
          this.nifDocGenerado = docGenerado[0].cifnif_propietario
          this.timeStampDocgenerado = docGenerado[0].selloDeTiempo;
          this.nameDocGenerado = docGenerado[0].name;
          this.lastInsertId = docGenerado[0].id;
          this.publicAccessId = docGenerado[0].publicAccessId;

          if (this.publicAccessId) {
            this.viewSignState(this.publicAccessId);
          }
        }
      },
      error: (err) => {
        console.error('Error obteniendo documentos', err);
        this.reqGenerado = false;
      }
    })
  }

  saveReasonRequest(): void {
    const motivo = this.formRequerimiento.get('motivoRequerimiento')?.value;
    this.expedienteService.updateDocFieldExpediente(this.actualID, 'motivoRequerimiento', motivo).subscribe();
    this.noRequestReasonText = false;
    this.reqGenerado = false;
  }

  generateActoAdmin(actoAdministrativoName: string, tipoTramite: string, docFieldToUpdate: string): void {
    const timeStamp = this.commonService.generateCustomTimestamp();
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      floatPrecision: 16
    });
  }

  viewSignState(publicAccessId: string) {
    this.viafirmaService.getDocumentStatus(publicAccessId)
    .subscribe((resp: DocSignedDTO) => {
      this.signatureDocState = resp.status;
      this.externalSignUrl = resp.addresseeLines[0].addresseeGroups[0].userEntities[0].externalSignUrl;
      this.sendedUserToSign = resp.addresseeLines[0].addresseeGroups[0].userEntities[0].userCode;
      const sendedDateToSign = resp.creationDate;
      this.sendedDateToSign = new Date(sendedDateToSign)
    })
  }

}
