import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { DocumentComponent } from '../../../../document/document.component';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { ExpedienteService } from '../../../../Services/expediente.service';
import { DocSignedDTO } from '../../../../Models/docsigned.dto';
import { CommonService } from '../../../../Services/common.service';
import { ViafirmaService } from '../../../../Services/viafirma.service';
import { catchError, of } from 'rxjs';
import { MatRadioModule } from '@angular/material/radio';
import { CustomValidatorsService } from '../../../../Services/custom-validators.service';

@Component({
  selector: 'app-detail-exped',
  standalone: true,
  imports: [
    CommonModule, DocumentComponent,
    ReactiveFormsModule, MatButtonModule, MatCheckboxModule,
    MatFormFieldModule, MatTabsModule,
    MatInputModule, TranslateModule,
    MatCardModule, MatSnackBarModule,
    MatRadioModule
  ],
  templateUrl: './detail-exped.component.html',
  styleUrl: './detail-exped.component.scss'
})
export class IsbaDetailExpedComponent {
  private route = inject(ActivatedRoute)
  private fb = inject(FormBuilder)
  private expedienteService = inject(ExpedienteService)
  private customValidatorService = inject(CustomValidatorsService)

  form!: FormGroup;
  idExpediente!: number;
  actualNif!: string;
  actualTimeStamp!: string;
  actualConvocatoria!: number;
  actualTipoTramite!: string;
  totalSolicitudesPrevias!: number;
  signedDocData!: DocSignedDTO;
  publicAccessId: string = "";
  businessType: string = "";
  isEditing: boolean = false;

  constructor(private commonService: CommonService, private viafirmaService: ViafirmaService) { }

  ngOnInit(): void {
    this.idExpediente = +this.route.snapshot.paramMap.get('id')!;

    this.form = this.fb.group({
      /* Detalle */
      id: [{ value: '', disabled: true }, []],
      empresa: [{ value: '', disabled: true }, [this.customValidatorService.xssProtectorValidator()]],
      nif: [{ value: '', disabled: true }, []],
      fecha_solicitud: [{ value: '', disabled: true }, []],
      tipo_tramite: [{ value: '', disabled: true }, []],
      telefono_rep: [{ value: '', disabled: true }, [Validators.maxLength(9), Validators.minLength(9), Validators.pattern('^\\d{1,9}$')]],
      email_rep: [{ value: '', disabled: true }, [Validators.email, this.customValidatorService.xssProtectorValidator()]],
      domicilio: [{ value: '', disabled: true }, [this.customValidatorService.xssProtectorValidator()]],
      localidad: [{ value: '', disabled: true }, [this.customValidatorService.xssProtectorValidator()]],
      cpostal: [{ value: '', disabled: true }, [this.customValidatorService.xssProtectorValidator(), Validators.minLength(5), Validators.maxLength(5), Validators.pattern('^\\d+$')]],
      telefono: [{ value: '', disabled: true }, [Validators.maxLength(9), Validators.minLength(9), Validators.pattern('^\\d{1,9}$')]],
      iae: [{ value: '', disabled: true }, []],
      nombre_rep: [{ value: '', disabled: true }, [this.customValidatorService.xssProtectorValidator()]],
      nif_rep: [{ value: '', disabled: true }, [this.customValidatorService.dniNieValidator()]],
      telefono_contacto_rep: [{ value: '', disabled: true }, [Validators.maxLength(9), Validators.minLength(9), Validators.pattern('^\\d{1,9}$')]],
      file_copiaNIF: [{ value: '', disabled: true }, []],
      file_certificadoATIB: [{ value: '', disabled: true }, []],
      file_certificadoSegSoc: [{ value: '', disabled: true }, []],
      comments: [{ value: '', disabled: true }, [this.customValidatorService.xssProtectorValidator()]],
      empresa_eco_idi_isba: [{ value: '', disabled: true }, []],
      finalidad_inversion_idi_isba: [{ value: '', disabled: true }, [this.customValidatorService.xssProtectorValidator()]],
      nom_entidad: [{ value: '', disabled: true }, [this.customValidatorService.xssProtectorValidator()]],
      importe_prestamo: [{ value: '', disabled: true }, [this.twoDecimalValidator()]],
      plazo_prestamo: [{ value: '', disabled: true }, []],
      cuantia_aval_idi_isba: [{ value: '', disabled: true }, [this.twoDecimalValidator()]],
      plazo_aval_idi_isba: [{ value: '', disabled: true }, []],
      fecha_aval_idi_isba: [{ value: '', disabled: true }, []],
      importe_ayuda_solicita_idi_isba: [{ value: '', disabled: true }, [this.twoDecimalValidator()]],
      intereses_ayuda_solicita_idi_isba: [{ value: '', disabled: true }, [this.twoDecimalValidator()]],
      coste_aval_solicita_idi_isba: [{ value: '', disabled: true }, [this.twoDecimalValidator()]],
      gastos_aval_solicita_idi_isba: [{ value: '', disabled: true }, [this.twoDecimalValidator()]],
      ayudasSubvenSICuales_dec_resp: [{ value: '', disabled: true }, [this.customValidatorService.xssProtectorValidator()]],
      tecnicoAsignado: [{ value: '', disabled: true }, []],
      situacion: [{ value: '', disabled: true }, []],
      /* Solicitud */
      fecha_REC: [{ value: '', disabled: true }, []],
      ref_REC: [{ value: '', disabled: true }, [this.customValidatorService.xssProtectorValidator()]],
      fecha_REC_enmienda: [{ value: '', disabled: true }, []],
      ref_REC_enmienda: [{ value: '', disabled: true }, [this.customValidatorService.xssProtectorValidator()]],
      fecha_requerimiento: [{ value: '', disabled: true }, []],
      fecha_requerimiento_notif: [{ value: '', disabled: true }, []],
      fecha_maxima_enmienda: [{ value: '', disabled: true }, []],
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
      ref_REC_justificacion: [{ value: '', disabled: true }, [this.customValidatorService.xssProtectorValidator()]],
      fecha_firma_res_pago_just: [{ value: '', disabled: true }, []],
      fecha_not_res_pago: [{ value: '', disabled: true }, []],
      fecha_inf_inicio_req_justif: [{ value: '', disabled: true }, []],
      fecha_inf_post_enmienda_justif: [{ value: '', disabled: true }, []],
      fecha_firma_requerimiento_justificacion: [{ value: '', disabled: true }, []],
      fecha_not_req_just: [{ value: '', disabled: true }, []],
      fecha_REC_requerimiento_justificacion: [{ value: '', disabled: true }, []],
      ref_REC_requerimiento_justificacion: [{ value: '', disabled: true }, [this.customValidatorService.xssProtectorValidator()]],
      /* Desestimiento o renuncia */
      fecha_REC_desestimiento: [{ value: '', disabled: true }, []],
      ref_REC_desestimiento: [{ value: '', disabled: true }, [this.customValidatorService.xssProtectorValidator()]],
      fecha_firma_resolucion_desestimiento: [{ value: '', disabled: true }, []],
      fecha_notificacion_desestimiento: [{ value: '', disabled: true }, []],
      fecha_propuesta_rev: [{ value: '', disabled: true }, []],
      fecha_not_pr_revocacion: [{ value: '', disabled: true }, []],
      fecha_resolucion_rev: [{ value: '', disabled: true }, []],
      fecha_not_r_revocacion: [{ value: '', disabled: true }, []]
    });
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
          this.businessType = expediente.tipo_solicitante
          this.actualNif = expediente.nif;
          this.actualTimeStamp = expediente.selloDeTiempo;
          this.actualConvocatoria = expediente.convocatoria;
          this.actualTipoTramite = expediente.tipo_tramite;
          this.publicAccessId = expediente.PublicAccessId
          this.checkViafirmaSign(this.publicAccessId)
          this.commonService.showSnackBar('✅ Expediente cargado correctamente.');
          this.getTotalNumberOfApplications(this.actualNif, this.actualTipoTramite, this.actualConvocatoria)
          this.form.patchValue(expediente);
        } else {
          this.commonService.showSnackBar('⚠️ No se encontró información del expediente.')
        }
      });
  }

  getTotalNumberOfApplications(nif: string, tipoTramite: string, convocatoria: number) {
    this.expedienteService.getTotalNumberOfApplicationsFromSolicitor(nif, tipoTramite, convocatoria)
      .pipe(
        catchError(error => {
          this.commonService.showSnackBar('❌ Error al contar el número de solicitudes. Inténtalo de nuevo más tarde. ' + error);
          return of(null)
        })
      )
      .subscribe(totalSolitudes => {
        if (totalSolitudes) {
          console.log(`Solicitudes previas: ${totalSolitudes.data.totalConvos}`)
          this.totalSolicitudesPrevias = totalSolitudes.data.totalConvos
        } else {
          this.commonService.showSnackBar('⚠️ No se encontró información sobre el número de solicitudes.');
        }
      });
  }

  checkViafirmaSign(publicKey: string) {
    this.viafirmaService.getDocumentStatus(publicKey).subscribe(
      (resp: DocSignedDTO) => {
        this.commonService.showSnackBar('✅ Documento firmado recibido correctamente:' + resp);
        this.signedDocData = resp;
        console.log(this.signedDocData.status)
      },
      (error: any) => {
        this.commonService.showSnackBar('❌ Error al obtener documento firmado');

        if (error.status === 0) {
          // CORS o problema de red
          this.commonService.showSnackBar('🌐 Error de red o CORS (status 0):' + error.message);
        } else {
          // Error HTTP con código real
          this.commonService.showSnackBar(`📡 Error HTTP ${error.status}:` + error.error || error.message);
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
      if ((controlName !== 'nif') && (controlName !== 'tipo_tramite') && (controlName !== 'fecha_solicitud')) {
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
