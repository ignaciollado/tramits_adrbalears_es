import { Component, inject, Injectable, viewChild } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import {MatExpansionModule} from '@angular/material/expansion';
import { ExpedienteService } from '../../../../Services/expediente.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';
import { DocumentComponent } from '../../../../document/document.component';
import { PindustLineaAyudaService } from '../../../../Services/linea-ayuda.service';
import { CommonService } from '../../../../Services/common.service';
import { ViafirmaService } from '../../../../Services/viafirma.service';
import { DocSignedDTO } from '../../../../Models/docsigned.dto';
import { PindustLineaAyudaDTO } from '../../../../Models/linea-ayuda-dto';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

@Injectable()
export class CustomDateAdapter extends NativeDateAdapter {
  override getFirstDayOfWeek(): number {
    return 1; // 0 = domingo, 1 = lunes
  }
}
@Component({
  selector: 'app-detalle-expediente',
  standalone: true,
  providers: [ { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
    { provide: DateAdapter, useClass: CustomDateAdapter },],
  templateUrl: './detail-exped.component.html',
  styleUrl: './detail-exped.component.scss',

  imports: [
    CommonModule, DocumentComponent,
    ReactiveFormsModule, MatButtonModule, MatCheckboxModule,
    MatFormFieldModule, MatTabsModule,
    MatInputModule, TranslateModule, MatSelectModule, MatExpansionModule,
    MatCardModule, MatSnackBarModule, MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
  ]
})

export class XecsDetailExpedComponent {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private expedienteService = inject(ExpedienteService);

  form!: FormGroup
  idExpediente!: number
  actualNif!: string
  actualIdExp!: number
  actualEmpresa!: string
  actualTimeStamp!: string
  actualConvocatoria!: number
  actualTipoTramite!: string
  totalSolicitudesPrevias!: number
  importeAyuda: number = 0
  signedDocData!: DocSignedDTO
  externalSignUrl: string = ""
  sendedUserToSign: string = ""
  sendedDateToSign!: Date 
  publicAccessId: string = ""
  lineaXecsConfig: PindustLineaAyudaDTO[] = []
  newAidAmount: number = 0

constructor( private commonService: CommonService, private adapter: DateAdapter<any>,
    private viafirmaService: ViafirmaService, private lineaXecsService: PindustLineaAyudaService ) {
      this.adapter.setLocale('es')
}

ngOnInit(): void {
    this.idExpediente = +this.route.snapshot.paramMap.get('id')!;

    this.form = this.fb.group({
    /* detalle */
    id: [{ value: '', disabled: true }],
    empresa: [{ value: '', disabled: true }],
    tipo_tramite: [{ value: '', disabled: true }],
    convocatoria: [{ value: '', disabled: true }],
    nif: [{ value: '', disabled: true }],
    domicilio: [{ value: '', disabled: true }],
    localidad: [{ value: '', disabled: true }],
    telefono: [{ value: '', disabled: true }],
    telefono_rep: [{ value: '', disabled: true }],
    email_rep: [{ value: '', disabled: true }],
    cpostal: [{ value: '', disabled: true }],
    iae: [{ value: '', disabled: true }],
    nombre_rep: [{ value: '', disabled: true }],
    file_copiaNIF: [{ value: '', disabled: true }],
    file_certificadoATIB: [{ value: '', disabled: true }],
    file_certificadoSegSoc: [{ value: '', disabled: true }],
    comments: [{ value: '', disabled: true }],
    nif_rep: [{ value: '', disabled: true }],
    tel_consultor: [{ value: '', disabled: true }],
    tecnicoAsignado: [{ value: '', disabled: true }],
    importeAyuda: [{ value: '', disabled: true }],
    porcentajeConcedido: [{ value: '', disabled: true }],
    ordenDePago: [{ value: '', disabled: true }],
    fechaEnvioAdministracion: [null],
    fecha_de_pago: [null],
    memoriaTecnicaEnIDI: [{ value: '', disabled: true }],
    certificadoIAEEnIDI: [{ value: '', disabled: true }],
    copiaNIFSociedadEnIDI: [{ value: '', disabled: true }],
    pJuridicaDocAcreditativaEnIDI: [{ value: '', disabled: true }],
    importe_minimis: [{ value: '', disabled: true }],
    situacion: [{ value: '', disabled: true }],
    fecha_solicitud: [{ value: '', disabled: true }],
    nom_consultor: [{ value: '', disabled: true }],
    empresa_consultor: [{ value: '', disabled: true }],
    mail_consultor: [{ value: '', disabled: true }],
    nom_entidad: [{ value: '', disabled: true }],
    cc_datos_bancarios: [{ value: '', disabled: true }],
    PublicAccessId: [{ value: '', disabled: true }],
    /* Solicitud */
    fecha_REC: [{ value: '', disabled: true }],
    ref_REC: [{ value: '', disabled: true }],
    fecha_REC_enmienda: [{ value: '', disabled: true }],
    ref_REC_enmienda: [{ value: '', disabled: true }],
    fecha_requerimiento: [{ value: '', disabled: true }],
    fecha_requerimiento_notif: [{ value: '', disabled: true }],
    motivoRequerimientoTexto:[''],
    /* Validación */
    fecha_infor_fav_desf: [{ value: '', disabled: true }],
    fecha_firma_propuesta_resolucion_prov: [{ value: '', disabled: true }],
    fecha_not_propuesta_resolucion_prov: [{ value: '', disabled: true }],
    fecha_firma_propuesta_resolucion_def: [{ value: '', disabled: true }],
    fecha_not_propuesta_resolucion_def: [{ value: '', disabled: true }],
    fecha_firma_res: [{ value: '', disabled: true }],
    fecha_notificacion_resolucion: [{ value: '', disabled: true }],
    /* Ejecución */
    fecha_kick_off: [{ value: '', disabled: true }],
    fecha_limite_consultoria: [{ value: '', disabled: true }],
    fecha_reunion_cierre: [{ value: '', disabled: true }],
    fecha_limite_justificacion: [{ value: '', disabled: true }],
    fecha_max_desp_ampliacion: [{ value: '', disabled: true }],
    fecha_REC_amp_termino: [{ value: '', disabled: true }],
    ref_REC_amp_termino: [{ value: '', disabled: true }],
    fecha_amp_termino: [{ value: '', disabled: true }],
    /* Justificación */
    fecha_REC_justificacion: [{ value: '', disabled: true }],
    ref_REC_justificacion: [{ value: '', disabled: true }],
    fecha_firma_res_pago_just: [{ value: '', disabled: true }],
    fecha_not_res_pago: [{ value: '', disabled: true }],
    fecha_firma_requerimiento_justificacion: [{ value: '', disabled: true }],
    fecha_not_req_just: [{ value: '', disabled: true }],
    fecha_REC_requerimiento_justificacion: [{ value: '', disabled: true }],
    ref_REC_requerimiento_justificacion: [{ value: '', disabled: true }],
    fecha_propuesta_rev: [{ value: '', disabled: true }],
    fecha_resolucion_rev: [{ value: '', disabled: true }],
    /* Desestimiento o renuncia */
    fecha_REC_desestimiento: [{ value: '', disabled: true }],
    ref_REC_desestimiento: [{ value: '', disabled: true }],
    fecha_firma_resolucion_desestimiento: [{ value: '', disabled: true }],
    fecha_notificacion_desestimiento: [{ value: '', disabled: true }],   
  });
  this.getExpedDetail(this.idExpediente)



  // Observa cambios en el campo 'fecha_de_pago'
  this.form.get('fecha_de_pago')?.valueChanges.subscribe(value => {
    const ordenDePagoControl = this.form.get('ordenDePago');
    if (value) {
      ordenDePagoControl?.setValue('SI');
    } else {
      ordenDePagoControl?.setValue('NO');
    }
    /* this.saveExpediente() */
  });

}

getExpedDetail(id: number) {
  this.expedienteService.getOneExpediente(id)
    .pipe(
      catchError(error => {
        this.commonService.showSnackBar('❌ Error al cargar el expediente. Inténtalo de nuevo más tarde. '+error);
        return of(null);
      })
    )
    .subscribe(expediente => {
      if (expediente) {
        this.form.patchValue(expediente);
        this.actualNif = expediente.nif
        this.actualIdExp = expediente.idExp
        this.actualEmpresa = expediente.empresa

        this.actualTimeStamp = expediente.selloDeTiempo	
        this.actualConvocatoria = expediente.convocatoria
        this.actualTipoTramite = expediente.tipo_tramite
        this.publicAccessId = expediente.PublicAccessId
        this.checkViafirmaSign(this.publicAccessId)
        this.commonService.showSnackBar('✅ Expediente cargado correctamente.');
        this.getTotalNumberOfApplications(this.actualNif, this.actualTipoTramite, this.actualConvocatoria)
      } else {
        this.commonService.showSnackBar('⚠️ No se encontró información del expediente.');
      }
    });
}

enableEdit(): void {
  Object.keys(this.form.controls).forEach(controlName => {
    const control = this.form.get(controlName);

    // Solo deshabilitamos 'nif' y 'tipo_tramite'
    if (controlName !== 'nif' && controlName !== 'tipo_tramite' && controlName !== 'importeAyuda' && controlName !== 'ordenDePago') {
      control?.enable();

      // Eliminar completamente el atributo readonly si existe
      const element = document.querySelector(`[formControlName="${controlName}"]`) as HTMLInputElement;
      if (element && element.hasAttribute('readonly')) {
        element.removeAttribute('readonly');
      }
    } else {
      control?.disable();

      // Asegurar que el campo quede en readonly
      const element = document.querySelector(`[formControlName="${controlName}"]`) as HTMLInputElement;
      if (element) {
        element.setAttribute('readonly', 'true');
      }
    }
  });
}

saveExpediente(): void {
  const expedienteActualizado = this.form.getRawValue();
  this.expedienteService.updateExpediente(this.idExpediente, expedienteActualizado)
    .subscribe({
      next: (resp: any) => {
        this.commonService.showSnackBar('✅ Expediente actualizado correctamente.');
        this.disableEdit(); // ← Aquí se vuelve a modo lectura
      },
      error: () => {
        this.commonService.showSnackBar('❌ Error al guardar el expediente.');
      }
    });
}

disableEdit(): void {
  Object.keys(this.form.controls).forEach(controlName => {
    const control = this.form.get(controlName);

    // Deshabilitamos todos los controles
    control?.disable();

    // Aseguramos que todos los campos tengan el atributo readonly
    const element = document.querySelector(`[formControlName="${controlName}"]`) as HTMLInputElement;
    if (element) {
      element.setAttribute('readonly', 'true');
    }
  });
}

getTotalNumberOfApplications(nif: string, tipoTramite: string, convocatoria: number) {
  this.expedienteService.getTotalNumberOfApplicationsFromSolicitor(nif, tipoTramite, convocatoria)
   .pipe(
      catchError(error => {
        this.commonService.showSnackBar('❌ Error al contar el número de solicitudes. Inténtalo de nuevo más tarde. '+error);
        return of(null);
      })
    )
    .subscribe(totalSolitudes => {
      if (totalSolitudes) {
        this.totalSolicitudesPrevias = totalSolitudes.data.totalConvos +1 /* LE SUMA 1 PORQUE SE CUENTA PRIMERA CONVOCATORIA, SEGUNDA CONVO, TERCERA... Y NO CONVOCATORIA CERO */
        this.calculateAidAmount()
      } else {
        this.commonService.showSnackBar('⚠️ No se encontró información sobre el número de solicitudes.');
      }
    });
}

checkViafirmaSign(publicKey: string) {
  if (!publicKey) return;

  this.viafirmaService.getDocumentStatus(publicKey).subscribe(
    (resp: DocSignedDTO) => {
      // Comprobar si la respuesta es un error conocido
      if (resp?.errorCode === 'WS_ERROR_CODE_1' && resp?.errorMessage === 'Unable to find request') {
        this.commonService.showSnackBar('❌ Error: No se ha encontrado la solicitud de firma.');
        return;
      }
      // Éxito
      this.commonService.showSnackBar('✅ Documento firmado recibido correctamente: ' + (resp.errorMessage || ''));
      this.signedDocData = resp;
      console.log ("signedDocData", this.signedDocData, this.signedDocData.addresseeLines[0].addresseeGroups[0].userEntities[0].userCode)
      this.sendedUserToSign =  this.signedDocData.addresseeLines[0].addresseeGroups[0].userEntities[0].userCode
      const sendedDateToSign = this.signedDocData.creationDate
      this.sendedDateToSign = new Date(sendedDateToSign)

      this.externalSignUrl = resp.addresseeLines[0].addresseeGroups[0].userEntities[0].externalSignUrl
    },
    (error: any) => {
      // Error
      this.commonService.showSnackBar('❌ Error al obtener documento firmado');

      if (error.status === 0) {
        // CORS o problema de red
        this.commonService.showSnackBar('🌐 Error de red o CORS (status 0): ' + error.message);
      } else {
        // Error HTTP con código real
        const mensaje = error.error?.error || error.message;
        this.commonService.showSnackBar(`📡 Error HTTP ${error.status}: ${mensaje}`);
        this.commonService.showSnackBar(`Ha ocurrido un error al consultar el estado de la firma.\nCódigo: ${error.status}\nMensaje: ${error.message}`);
      }
    }
  );
}


showSignedDocument(publicKey: string) {
  this.viafirmaService.viewDocument(publicKey).subscribe(
    (resp: DocSignedDTO) => {
      console.log ("publicKey", publicKey, resp)
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
        const fileURL = URL.createObjectURL(blob);

        // Abrir en nueva pestaña
        window.open(fileURL, '_blank');

        this.commonService.showSnackBar('✅ Documento firmado recibido correctamente: ' + resp.filename);
      } catch (e) {
        this.commonService.showSnackBar('❌ Error al procesar el documento PDF: '+ e);
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
        console.log ("error", error.status, error.message)
        this.commonService.showSnackBar(`Ha ocurrido un error al consultar documento de la firma.\nCódigo: ${error.status}\nMensaje: ${errorMsg}`);
      }
    }
  );
}

calculateAidAmount() {
  this.lineaXecsService.getAll().subscribe(
    (lineaAyudaItems: PindustLineaAyudaDTO[]) => {
      this.lineaXecsConfig = lineaAyudaItems.filter((item: PindustLineaAyudaDTO) => {
        return item.convocatoria === this.actualConvocatoria &&
               item.lineaAyuda === "XECS";
      });
    const rawImporte = this.form.get('importeAyuda')?.value
    const importe = Number(rawImporte) || 0
    if (importe === 0) {
      switch ((this.actualTipoTramite).trim().toLowerCase()) {
        case 'programa i':
            switch(this.totalSolicitudesPrevias) {
                case 1:
                    //this.importeAyuda = $objs->Programa_I->edicion->Primera[0]*($objs->Programa_I->edicion->Primera[1]/100);
                    this.newAidAmount = JSON.parse(this.lineaXecsConfig[0].programa).Programa_I.edicion.Primera[0] *(JSON.parse(this.lineaXecsConfig[0].programa).Programa_I.edicion.Primera[1]/100)
                    this.form.patchValue({ importeAyuda: this.newAidAmount })
                    break;
                case 2:
                    //this.importeAyuda = $objs->Programa_I->edicion->Segunda[0]*($objs->Programa_I->edicion->Segunda[1]/100);
                    this.newAidAmount = JSON.parse(this.lineaXecsConfig[0].programa).Programa_I.edicion.Segunda[0] *(JSON.parse(this.lineaXecsConfig[0].programa).Programa_I.edicion.Segunda[1]/100)
                    this.form.patchValue({ importeAyuda: this.newAidAmount })
                    break;
                default:
                    //this.importeAyuda = $objs->Programa_I->edicion->Tercera[0]*($objs->Programa_I->edicion->Tercera[1]/100);
                    this.newAidAmount = JSON.parse(this.lineaXecsConfig[0].programa).Programa_I.edicion.Tercera[0] *(JSON.parse(this.lineaXecsConfig[0].programa).Programa_I.edicion.Tercera[1]/100)
                    this.form.patchValue({ importeAyuda: this.newAidAmount })
            }
            break;
        case 'programa ii':
            switch(this.totalSolicitudesPrevias) {
                case 1:
                  //this.importeAyuda = $objs->Programa_II->edicion->Primera[0]*($objs->Programa_II->edicion->Primera[1]/100);
                  this.newAidAmount = JSON.parse(this.lineaXecsConfig[0].programa).Programa_II.edicion.Primera[0] *(JSON.parse(this.lineaXecsConfig[0].programa).Programa_II.edicion.Primera[1]/100)
                  this.form.patchValue({ importeAyuda:  this.newAidAmount })
                  break;
                default:
                  //this.importeAyuda = $objs->Programa_II->edicion->Segunda[0]*($objs->Programa_II->edicion->Segunda[1]/100);
                  this.newAidAmount = JSON.parse(this.lineaXecsConfig[0].programa).Programa_II.edicion.Segunda[0] *(JSON.parse(this.lineaXecsConfig[0].programa).Programa_II.edicion.Segunda[1]/100)
                  this.form.patchValue({ importeAyuda: this.newAidAmount })
            }
            break;
        case 'programa iii': /* Mantengo esta opción por compatibilidad con las CONVOS anteriores a 2024 */
            switch(this.totalSolicitudesPrevias) {
                case 1:
                    //this.importeAyuda = $objs->Programa_III->edicion->Primera[0]*($objs->Programa_III->edicion->Primera[1]/100);
                    this.newAidAmount = JSON.parse(this.lineaXecsConfig[0].programa).Programa_III.edicion.Primera[0] *(JSON.parse(this.lineaXecsConfig[0].programa).Programa_III.edicion.Primera[1]/100)
                    this.form.patchValue({ importeAyuda: this.newAidAmount })
                    break;
                default:
                    //this.importeAyuda = $objs->Programa_III->edicion->Segunda[0]*($objs->Programa_III->edicion->Segunda[1]/100);
                    this.newAidAmount = JSON.parse(this.lineaXecsConfig[0].programa).Programa_III.edicion.Segunda[0] *(JSON.parse(this.lineaXecsConfig[0].programa).Programa_III.edicion.Segunda[1]/100)
                    this.form.patchValue({ importeAyuda: this.newAidAmount })
            }
            break;
        case 'programa iii actuacions producte':
            switch(this.totalSolicitudesPrevias) {
                case 1:
                    //this.importeAyuda = $objs->Programa_III_ap->edicion->Primera[0]*($objs->Programa_III_ap->edicion->Primera[1]/100);
                    this.newAidAmount = JSON.parse(this.lineaXecsConfig[0].programa).Programa_III_ap.edicion.Primera[0] *(JSON.parse(this.lineaXecsConfig[0].programa).Programa_III_ap.edicion.Primera[1]/100)
                    this.form.patchValue({ importeAyuda: this.newAidAmount })
                    break;
                default:
                    //this.importeAyuda = $objs->Programa_III_ap->edicion->Segunda[0]*($objs->Programa_III_ap->edicion->Segunda[1]/100);
                    this.newAidAmount = JSON.parse(this.lineaXecsConfig[0].programa).Programa_III_ap.edicion.Segunda[0] *(JSON.parse(this.lineaXecsConfig[0].programa).Programa_III_ap.edicion.Segunda[1]/100)
                    this.form.patchValue({ importeAyuda: this.newAidAmount })
            }
            break;
        case 'programa iii actuacions corporatives':
            switch(this.totalSolicitudesPrevias) {
                case 1:
                    //this.importeAyuda = $objs->Programa_III_ac->edicion->Primera[0]*($objs->Programa_III_ac->edicion->Primera[1]/100);
                    this.newAidAmount = JSON.parse(this.lineaXecsConfig[0].programa).Programa_III_ac.edicion.Primera[0] *(JSON.parse(this.lineaXecsConfig[0].programa).Programa_III_ac.edicion.Primera[1]/100)
                    this.form.patchValue({ importeAyuda: this.newAidAmount })
                    break;
                default:
                    //this.importeAyuda = $objs->Programa_III_ac->edicion->Segunda[0]*($objs->Programa_III_ac->edicion->Segunda[1]/100);
                    this.newAidAmount = JSON.parse(this.lineaXecsConfig[0].programa).Programa_III_ac.edicion.Segunda[0] *(JSON.parse(this.lineaXecsConfig[0].programa).Programa_III_ac.edicion.Segunda[1]/100)
                    this.form.patchValue({ importeAyuda: this.newAidAmount })
            }
            break;
        case 'programa iv':
            switch(this.totalSolicitudesPrevias) {
                case 1:
                    //this.importeAyuda = $objs->Programa_IV->edicion->Primera[0]*($objs->Programa_IV->edicion->Primera[1]/100);
                    this.newAidAmount = JSON.parse(this.lineaXecsConfig[0].programa).Programa_IV.edicion.Primera[0] *(JSON.parse(this.lineaXecsConfig[0].programa).Programa_IV.edicion.Primera[1]/100)
                    this.form.patchValue({ importeAyuda: this.newAidAmount })
                    break;
                default:
                    //this.importeAyuda = $objs->Programa_IV->edicion->Segunda[0]*($objs->Programa_IV->edicion->Segunda[1]/100);
                    this.newAidAmount = JSON.parse(this.lineaXecsConfig[0].programa).Programa_IV.edicion.Segunda[0] *(JSON.parse(this.lineaXecsConfig[0].programa).Programa_IV.edicion.Segunda[1]/100)
                    this.form.patchValue({ importeAyuda: this.newAidAmount })
            }
            break;
        }
    this.saveExpediente()
    } 
    }
  );
}
}