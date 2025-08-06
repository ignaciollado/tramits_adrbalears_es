import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, of } from 'rxjs';
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
    CommonModule, DocumentComponent,
    ReactiveFormsModule, MatButtonModule, MatCheckboxModule,
    MatFormFieldModule, MatTabsModule,
    MatInputModule, TranslateModule,
    MatCardModule, MatSnackBarModule
  ],
  templateUrl: './detail-exped.component.html',
  styleUrl: './detail-exped.component.scss'
})
export class IlsDetailExpedComponent {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private expedienteService = inject(ExpedienteService)
  private customValidatorService = inject(CustomValidatorsService)

  form!: FormGroup
  idExpediente!: number
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
      cpostal: [{ value: '', disabled: true }, [this.customValidatorService.xssProtectorValidator(), Validators.maxLength(5), Validators.minLength(5), Validators.pattern('^\\d+$')]],
      telefono: [{ value: '', disabled: true }, [Validators.maxLength(9), Validators.minLength(9), Validators.pattern('^\\d{1,9}$')]],
      iae: [{ value: '', disabled: true }, []],
      nombre_rep: [{ value: '', disabled: true }, [this.customValidatorService.xssProtectorValidator()]],
      nif_rep: [{ value: '', disabled: true }, [this.customValidatorService.dniNieValidator(), Validators.minLength(9), Validators.maxLength(9)]],
      tecnicoAsignado: [{ value: '', disabled: true }, []],
      situacion: [{ value: '', disabled: true }, []],
      sitio_web_empresa: [{ value: '', disabled: true }, [this.customValidatorService.xssProtectorValidator()]],
      video_empresa: [{ value: '', disabled: true }, [this.customValidatorService.xssProtectorValidator()]],

      /* Solicitud */
      fecha_REC: [{ value: '', disabled: true }, []],
      ref_REC: [{ value: '', disabled: true }, [this.customValidatorService.xssProtectorValidator()]],
      fecha_REC_enmienda: [{ value: '', disabled: true }, []],
      ref_REC_enmienda: [{ value: '', disabled: true }, [this.customValidatorService.xssProtectorValidator()]],
      fecha_requerimiento: [{ value: '', disabled: true }, []],
      fecha_requerimiento_notif: [{ value: '', disabled: true }, []],
      fecha_maxima_enmienda: [{ value: '', disabled: true }, []],

      /* Adhesión */
      fecha_infor_fav: [{ value: '', disabled: true }, []],
      fecha_infor_desf: [{ value: '', disabled: true }, []],
      fecha_resolucion: [{ value: '', disabled: true }, []],
      fecha_notificacion_resolucion: [{ value: '', disabled: true }, []],

      /* Seguimiento */
      fecha_adhesion_ils: [{ value: '', disabled: true }, []],
      fecha_seguimiento_adhesion_ils: [{ value: '', disabled: true }, []],
      fecha_limite_presentacion: [{ value: '', disabled: true }, []],
      fecha_rec_informe_seguimiento: [{ value: '', disabled: true }, []],
      ref_REC_informe_seguimiento: [{ value: '', disabled: true }, [this.customValidatorService.xssProtectorValidator()]],

      /* Renovación */
      fecha_renovacion: [{ value: '', disabled: true }, []],
      fecha_infor_fav_renov: [{ value: '', disabled: true }, []],
      fecha_infor_desf_renov: [{ value: '', disabled: true }, []],
      fecha_firma_req_renov: [{ value: '', disabled: true }, []],
      fecha_notif_req_renov: [{ value: '', disabled: true }, []],
      fecha_REC_enmienda_renov: [{ value: '', disabled: true }, []],
      fecha_REC_justificacion_renov: [{ value: '', disabled: true }, []],
      ref_REC_justificacion_renov: [{ value: '', disabled: true }, [this.customValidatorService.xssProtectorValidator()]],
      fecha_resolucion_renov: [{ value: '', disabled: true }, []],
      fecha_notificacion_renov: [{ value: '', disabled: true }, []],
      fecha_res_revocacion_marca: [{ value: '', disabled: true }, []]

    });
    this.getExpedDetail(this.idExpediente)
  }

  getExpedDetail(id: number) {
    this.expedienteService.getOneExpediente(id)
      .pipe(
        catchError(error => {
          this.commonService.showSnackBar('❌ Error al cargar el expediente. Inténtalo de nuevo más tarde. ' + error);
          return of(null)
        })
      )
      .subscribe(expediente => {
        if (expediente) {
          this.businessType = expediente.tipo_solicitante
          this.actualNif = expediente.nif;
          this.actualTimeStamp = expediente.selloDeTiempo;
          this.actualConvocatoria = expediente.convocatoria;
          this.actualTipoTramite = expediente.tipo_tramite;
          this.publicAccessId = expediente.PublicAccessId;
          this.checkViafirmaSign(this.publicAccessId);
          this.commonService.showSnackBar('✅ Expediente cargado correctamente.');
          this.getTotalNumberOfApplications(this.actualNif, this.actualTipoTramite, this.actualConvocatoria)
          this.form.patchValue(expediente)
        } else {
          this.commonService.showSnackBar('⚠️ No se encontró información del expediente.')
        }
      })
  }

  getTotalNumberOfApplications(nif: string, tipoTramite: string, convocatoria: number) {
    this.expedienteService.getTotalNumberOfApplicationsFromSolicitor(nif, tipoTramite, convocatoria)
      .pipe(
        catchError(error => {
          this.commonService.showSnackBar('❌ Error al contar el número de solicitudes. Inténtalo de nuevo más tarde. ' + error)
          return of(null)
        })
      )
      .subscribe(totalSolicitudes => {
        if (totalSolicitudes) {
          this.totalSolicitudesPrevias = totalSolicitudes.data.totalConvos
        } else {
          this.commonService.showSnackBar('⚠️ No se encontró información sobre el número de solicitudes.');
        }
      })
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
        console.log("resp", resp)
        if (!resp || !resp.base64 || !resp.filename) {
          this.commonService.showSnackBar('⚠️ Respuesta inválida del servidor.');
          return;
        }

        try {
          // Decodificar base64 a binario
          const byteCharacters = atob(resp.base64);
          const byteNumbers = Array.from(byteCharacters, char => char.charCodeAt(0));
          const byteArray = new Uint8Array(byteNumbers);

          // Crear Blob y URL
          const blob = new Blob([byteArray], { type: 'application/pdf' });
          const fileURL = URL.createObjectURL(blob)

          window.open(fileURL, '_blank')
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
    this.isEditing = !this.isEditing;
    Object.keys(this.form.controls).forEach(controlName => {
      if ((controlName !== 'nif') && (controlName !== 'tipo_tramite') && (controlName !== "fecha_solicitud")) {
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
