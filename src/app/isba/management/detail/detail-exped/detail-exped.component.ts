import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, of } from 'rxjs';
import { ResolucionConcesionConRequerimientoAdrIsbaComponent } from '../../../../actos-admin-adr-isba/10_resolucion-concesion-con-requerimiento/resolucion-concesion-con-requerimiento.component';
import { ResolucionDePagoYJustificacionAdrIsbaComponent } from '../../../../actos-admin-adr-isba/11_resolucion-de-pago-y-justificacion/resolucion-de-pago-y-justificacion.component';
import { ResolucionDesestimientoPorRenunciaAdrIsbaComponent } from '../../../../actos-admin-adr-isba/15_resolucion-desestimiento-por-renuncia/resolucion-desestimiento-por-renuncia.component';
import { PrRevocacionPorNoJustificarAdrIsbaComponent } from '../../../../actos-admin-adr-isba/16_pr-revocacion-por-no-justificar/pr-revocacion-por-no-justificar.component';
import { ResolucionRevocacionPorNoJustificarAdrIsbaComponent } from '../../../../actos-admin-adr-isba/17_resolucion-revocacion-por-no-justificar/resolucion-revocacion-por-no-justificar.component';
import { RequerimientoAdrIsbaComponent } from '../../../../actos-admin-adr-isba/1_requerimiento/requerimiento.component';
import { DeclaracionResponsableAdrIsbaComponent } from '../../../../actos-admin-adr-isba/20_declaracion-responsable/declaracion-responsable.component';
import { ResolDesestimientoNoEnmendarAdrIsbaComponent } from '../../../../actos-admin-adr-isba/2_resol-desestimiento-no-enmendar/resol-desestimiento-no-enmendar.component';
import { InformeFavorableAdrIsbaComponent } from '../../../../actos-admin-adr-isba/3_informe-favorable/informe-favorable.component';
import { InformeFavorableConRequerimientoAdrIsbaComponent } from '../../../../actos-admin-adr-isba/4_informe-favorable-con-requerimiento/informe-favorable-con-requerimiento.component';
import { PrProvisionalFavorableAdrIsbaComponent } from '../../../../actos-admin-adr-isba/5_pr-provisional-favorable/pr-provisional-favorable.component';
import { PrProvisionalFavorableConRequerimientoAdrIsbaComponent } from '../../../../actos-admin-adr-isba/6_pr-provisional-favorable-con-requerimiento/pr-provisional-favorable-con-requerimiento.component';
import { PrDefinitivaFavorableAdrIsbaComponent } from '../../../../actos-admin-adr-isba/7_pr-definitiva-favorable/pr-definitiva-favorable.component';
import { PrDefinitivaFavorableConRequerimientoAdrIsbaComponent } from '../../../../actos-admin-adr-isba/8_pr-definitiva-favorable-con-requerimiento/pr-definitiva-favorable-con-requerimiento.component';
import { ResolucionConcesionAdrIsbaComponent } from '../../../../actos-admin-adr-isba/9_resolucion-concesion/resolucion-concesion.component';
import { AddDocumentComponent } from '../../../../add-document/add-document.component';
import { DocumentComponent } from '../../../../document/document.component';
import { DocSignedDTO } from '../../../../Models/docsigned.dto';
import { CommonService } from '../../../../Services/common.service';
import { CustomValidatorsService } from '../../../../Services/custom-validators.service';
import { ExpedienteService } from '../../../../Services/expediente.service';
import { ViafirmaService } from '../../../../Services/viafirma.service';

@Component({
  selector: 'app-detail-exped',
  standalone: true,
  imports: [
    CommonModule, DocumentComponent, AddDocumentComponent,
    ReactiveFormsModule, MatButtonModule, MatCheckboxModule,
    MatFormFieldModule, MatTabsModule,
    MatInputModule, TranslateModule,
    MatCardModule, MatSnackBarModule,
    MatRadioModule,
    MatExpansionModule,
    MatSelectModule,
    RequerimientoAdrIsbaComponent,
    ResolDesestimientoNoEnmendarAdrIsbaComponent, InformeFavorableAdrIsbaComponent,
    InformeFavorableConRequerimientoAdrIsbaComponent,
    PrProvisionalFavorableAdrIsbaComponent, PrProvisionalFavorableConRequerimientoAdrIsbaComponent,
    PrDefinitivaFavorableAdrIsbaComponent, PrDefinitivaFavorableConRequerimientoAdrIsbaComponent,
    ResolucionConcesionAdrIsbaComponent, ResolucionConcesionConRequerimientoAdrIsbaComponent,
    ResolucionDePagoYJustificacionAdrIsbaComponent, ResolucionDesestimientoPorRenunciaAdrIsbaComponent,
    PrRevocacionPorNoJustificarAdrIsbaComponent, ResolucionRevocacionPorNoJustificarAdrIsbaComponent,
    DeclaracionResponsableAdrIsbaComponent

  ],
  templateUrl: './detail-exped.component.html',
  styleUrl: './detail-exped.component.scss'
})
export class IsbaDetailExpedComponent {
  private route = inject(ActivatedRoute)
  private fb = inject(FormBuilder)
  private expedienteService = inject(ExpedienteService)
  private customValidatorService = inject(CustomValidatorsService)
  noRequestReasonText: boolean = true;
  noRevocationReasonText: boolean = true;

  form!: FormGroup;
  idExpediente!: number;
  actualNif!: string;
  actualID!: number;
  actualIdExp!: number;
  actualEmpresa!: string;
  actualTimeStamp!: string;
  actualConvocatoria!: number;
  actualTipoTramite!: string;
  signedDocData!: DocSignedDTO;
  publicAccessId: string = "";
  businessType: string = "";
  motivoRequerimiento: string = "";
  motivoRevocacion: string = "";
  isEditing: boolean = false;
  externalSignUrl: string = "";
  sendedUserToSign: string = "";
  sendedDateToSign!: Date;

  situations: any[] = [];

  constructor(private commonService: CommonService, private viafirmaService: ViafirmaService) { }

  ngOnInit(): void {
    this.idExpediente = +this.route.snapshot.paramMap.get('id')!;

    this.form = this.fb.group({
      /* Detalle */
      id: [{ value: '', disabled: true }, []],
      empresa: [{ value: '', disabled: true }, []],
      nif: [{ value: '', disabled: true }, []],
      fecha_solicitud: [{ value: '', disabled: true }, []],
      tipo_tramite: [{ value: '', disabled: true }, []],
      telefono_rep: [{ value: '', disabled: true }, [Validators.maxLength(9), Validators.minLength(9), Validators.pattern('^\\d{1,9}$')]],
      email_rep: [{ value: '', disabled: true }, [Validators.email]],
      domicilio: [{ value: '', disabled: true }, []],
      localidad: [{ value: '', disabled: true }, []],
      cpostal: [{ value: '', disabled: true }, [Validators.minLength(5), Validators.maxLength(5), Validators.pattern('^\\d+$')]],
      telefono: [{ value: '', disabled: true }, [Validators.maxLength(9), Validators.minLength(9), Validators.pattern('^\\d{1,9}$')]],
      iae: [{ value: '', disabled: true }, []],
      nombre_rep: [{ value: '', disabled: true }, []],
      nif_rep: [{ value: '', disabled: true }, [this.customValidatorService.dniNieValidator()]],
      telefono_contacto_rep: [{ value: '', disabled: true }, [Validators.maxLength(9), Validators.minLength(9), Validators.pattern('^\\d{1,9}$')]],
      file_copiaNIF: [{ value: '', disabled: true }, []],
      file_certificadoATIB: [{ value: '', disabled: true }, []],
      file_certificadoSegSoc: [{ value: '', disabled: true }, []],
      comments: [{ value: '', disabled: true }, []],
      empresa_eco_idi_isba: [{ value: '', disabled: true }, []],
      finalidad_inversion_idi_isba: [{ value: '', disabled: true }, []],
      nom_entidad: [{ value: '', disabled: true }, []],
      importe_prestamo: [{ value: '', disabled: true }, [this.twoDecimalValidator()]],
      plazo_prestamo: [{ value: '', disabled: true }, []],
      cuantia_aval_idi_isba: [{ value: '', disabled: true }, [this.twoDecimalValidator()]],
      plazo_aval_idi_isba: [{ value: '', disabled: true }, []],
      fecha_aval_idi_isba: [{ value: '', disabled: true }, []],
      importe_presupuesto_idi_isba: [{ value: '', disabled: true }, [this.twoDecimalValidator()]],
      intereses_ayuda_solicita_idi_isba: [{ value: '', disabled: true }, [this.twoDecimalValidator()]],
      coste_aval_solicita_idi_isba: [{ value: '', disabled: true }, [this.twoDecimalValidator()]],
      gastos_aval_solicita_idi_isba: [{ value: '', disabled: true }, [this.twoDecimalValidator()]],
      importe_ayuda_solicita_idi_isba: [{ value: '', disabled: true }, [this.twoDecimalValidator()]],
      ayudasSubvenSICuales_dec_resp: [{ value: '', disabled: true }, []],
      tecnicoAsignado: [{ value: '', disabled: true }, []],
      situacion: [{ value: '', disabled: true }, []],
      /* Solicitud */
      fecha_REC: [{ value: '', disabled: true }, []],
      ref_REC: [{ value: '', disabled: true }, [Validators.maxLength(16)]],
      fecha_REC_enmienda: [{ value: '', disabled: true }, []],
      ref_REC_enmienda: [{ value: '', disabled: true }, [Validators.maxLength(16)]],
      fecha_requerimiento: [{ value: '', disabled: true }, []],
      fecha_requerimiento_notif: [{ value: '', disabled: true }, []],
      fecha_maxima_enmienda: [{ value: '', disabled: true }, []],
      motivoRequerimiento: [{ value: '', disabled: false }, []],
      /* Validación */
      fecha_infor_fav_desf: [{ value: '', disabled: true }, []],
      fecha_firma_propuesta_resolucion_prov: [{ value: '', disabled: true }, []],
      fecha_not_propuesta_resolucion_prov: [{ value: '', disabled: true }, []],
      fecha_firma_propuesta_resolucion_def: [{ value: '', disabled: true }, []],
      fecha_not_propuesta_resolucion_def: [{ value: '', disabled: true }, []],
      fecha_firma_res: [{ value: '', disabled: true }, []],
      /* Justificación */
      fecha_notificacion_resolucion: [{ value: '', disabled: true }, []],
      fecha_limite_justificacion: [{ value: '', disabled: true }, []],
      fecha_REC_justificacion: [{ value: '', disabled: true }, []],
      ref_REC_justificacion: [{ value: '', disabled: true }, [Validators.maxLength(16)]],
      fecha_firma_res_pago_just: [{ value: '', disabled: true }, []],
      fecha_not_res_pago: [{ value: '', disabled: true }, []],
      fecha_inf_inicio_req_justif: [{ value: '', disabled: true }, []],
      fecha_inf_post_enmienda_justif: [{ value: '', disabled: true }, []],
      fecha_firma_requerimiento_justificacion: [{ value: '', disabled: true }, []],
      fecha_not_req_just: [{ value: '', disabled: true }, []],
      fecha_REC_requerimiento_justificacion: [{ value: '', disabled: true }, []],
      ref_REC_requerimiento_justificacion: [{ value: '', disabled: true }, [Validators.maxLength(16)]],
      /* Desestimiento o renuncia */
      fecha_REC_desestimiento: [{ value: '', disabled: true }, []],
      ref_REC_desestimiento: [{ value: '', disabled: true }, [Validators.maxLength(16)]],
      fecha_firma_resolucion_desestimiento: [{ value: '', disabled: true }, []],
      fecha_notificacion_desestimiento: [{ value: '', disabled: true }, []],
      fecha_propuesta_rev: [{ value: '', disabled: true }, []],
      fecha_not_pr_revocacion: [{ value: '', disabled: true }, []],
      fecha_resolucion_rev: [{ value: '', disabled: true }, []],
      fecha_not_r_revocacion: [{ value: '', disabled: true }, []],
      motivoResolucionRevocacionPorNoJustificar: [{ value: '', disabled: false }, []]
    });

    this.commonService.getSituations().subscribe((situations: any[]) => {
      this.situations = situations;
    })

    this.getExpedDetail(this.idExpediente)
  }

  twoDecimalValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      const regex = /^\d+([.,]\d{2})$/;
      return value && !regex.test(value) ? { invalidDecimal: true } : null;
    };
  }

  getExpedDetail(id: number) {
    this.expedienteService.getOneExpediente(id)
      .pipe(
        catchError(error => {
          this.commonService.showSnackBar('❌ Error al cargar el expediente. Inténtalo de nuevo más tarde. ' + error);
          return of(null);
        })
      )
      .subscribe(expediente => {
        if (expediente) {
          if (expediente.motivoResolucionRevocacionPorNoJustificar) {
            this.noRevocationReasonText = false;
          }
          this.form.patchValue(expediente);
          this.businessType = expediente.tipo_solicitante
          this.actualNif = expediente.nif;
          this.actualID = expediente.id;
          this.actualIdExp = expediente.idExp;
          this.actualEmpresa = expediente.empresa;
          this.actualTimeStamp = expediente.selloDeTiempo;
          this.actualConvocatoria = expediente.convocatoria;
          this.actualTipoTramite = expediente.tipo_tramite;
          this.publicAccessId = expediente.PublicAccessId;
          this.motivoRequerimiento = expediente.motivoRequerimiento;
          this.motivoRevocacion = expediente.motivoResolucionRevocacionPorNoJustificar;

          this.checkViafirmaSign(this.publicAccessId)
          this.commonService.showSnackBar('✅ Expediente cargado correctamente.');
        } else {
          this.commonService.showSnackBar('⚠️ No se encontró información del expediente.')
        }
      });
  }

  checkViafirmaSign(publicKey: string) {
    if (!publicKey) return;

    this.viafirmaService.getDocumentStatus(publicKey).subscribe(
      (resp: DocSignedDTO) => {
        if (resp?.errorCode === "WS_ERROR_CODE_1" && resp?.errorMessage === "Unable to find request") {
          this.commonService.showSnackBar('❌ Error: No se ha encontrado la solicitud de firma.');
          return;
        }

        this.commonService.showSnackBar('✅ Documento firmado recibido correctamente:' + resp);
        this.signedDocData = resp;
        console.log("signedDocData", this.signedDocData, this.signedDocData.addresseeLines[0].addresseeGroups[0].userEntities[0].userCode)
        this.sendedUserToSign = this.signedDocData.addresseeLines[0].addresseeGroups[0].userEntities[0].userCode;
        const sendedDateToSign = this.signedDocData.creationDate;
        this.sendedDateToSign = new Date(sendedDateToSign);

        this.externalSignUrl = resp.addresseeLines[0].addresseeGroups[0].userEntities[0].externalSignUrl;

      },
      (error: any) => {
        this.commonService.showSnackBar('❌ Error al obtener documento firmado');

        if (error.status === 0) {
          // CORS o problema de red
          this.commonService.showSnackBar('🌐 Error de red o CORS (status 0):' + error.message);
        } else {
          // Error HTTP con código real
          const mensaje = error.error?.error || error.message;
          this.commonService.showSnackBar(`📡 Error HTTP ${error.status}: ${mensaje}`);
          this.commonService.showSnackBar(`Ha ocurrido un error al consultar el estado de la firma.\nCódigo: ${error.status}\nMensaje: ${error.message}`);
        }
      }
    )
  }

  showSignedDocument(publicKey: string) {
    this.viafirmaService.viewDocument(publicKey).subscribe(
      (resp: DocSignedDTO) => {
        console.log("resp", resp);
        if (!resp || !resp.base64 || !resp.filename) {
          this.commonService.showSnackBar('⚠️ Respuesta inválida del servidor.');
          return;
        }

        try {
          // Decodificar base64 a binario
          const byteCharacters = atob(resp.base64);
          const byteNumbers = Array.from(byteCharacters, char => char.charCodeAt(0));
          const byteArray = new Uint8Array(byteNumbers)

          // Crear Blob y URL
          const blob = new Blob([byteArray], { type: 'application/pdf' });
          const fileURL = URL.createObjectURL(blob)

          window.open(fileURL, '_blank');
          this.commonService.showSnackBar('✅ Documento firmado recibido correctamente: ' + resp.filename);

        } catch (e) {
          this.commonService.showSnackBar('❌ Error al procesar el documento PDF.');
          console.error('Error al decodificar base64:', e);

        }
      },
      (error: any) => {
        this.commonService.showSnackBar('❌ Error al obtener documento firmado');
        if (error.status === 0) {
          this.commonService.showSnackBar('🌐 Error de red o CORS (status 0): ' + error.message);
        } else {
          const errorMsg = error.error?.message || error.message || 'Error desconocido';
          this.commonService.showSnackBar(`📡 Error HTTP ${error.status}: ${errorMsg}`);
          this.commonService.showSnackBar(`Ha ocurrido un error al consultar documento de la firma.\nCódigo: ${error.status}\nMensaje: ${errorMsg}`);
        }
      }
    )
  }

  enableEdit(): void {
    this.isEditing = !this.isEditing
    Object.keys(this.form.controls).forEach(controlName => {
      if ((controlName !== 'nif') && (controlName !== 'tipo_tramite') && (controlName !== 'fecha_solicitud') && (controlName !== "motivoRequerimiento") && (controlName !== 'motivoResolucionRevocacionPorNoJustificar')) {
        if (this.isEditing) {
          this.form.get(controlName)?.enable();
        } else {
          this.form.get(controlName)?.disable()
        }
      }
    })
  }

  saveExpediente(): void {
    const expedienteActualizado = this.form.getRawValue()
    this.expedienteService.updateExpediente(this.idExpediente, expedienteActualizado)
      .subscribe({
        next: () => {
          this.commonService.showSnackBar('✅ Expediente guardado correctamente.');
          this.enableEdit()
        },
        error: () => this.commonService.showSnackBar('❌ Error al guardar el expediente.')
      })
  }
}
