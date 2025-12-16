import { Component, inject, Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DocumentComponent } from '../../../../document/document.component';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { ExpedienteService } from '../../../../Services/expediente.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';

import { PindustLineaAyudaService } from '../../../../Services/linea-ayuda.service';
import { CommonService } from '../../../../Services/common.service';
import { ViafirmaService } from '../../../../Services/viafirma.service';
import { DocSignedDTO } from '../../../../Models/docsigned.dto';
import { PindustLineaAyudaDTO } from '../../../../Models/linea-ayuda-dto';
import { DocumentoGeneradoDTO } from '../../../../Models/documentos-generados-dto';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';

import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { SignatureResponse } from '../../../../Models/signature.dto';

/* tab solicitud */
import { RequerimientoComponent } from '../../../../actos-admin/1_requerimiento/requerimiento.component';
import { ResolDesestimientoNoEnmendarComponent } from '../../../../actos-admin/2_resol-desestimiento-no-enmendar/resol-desestimiento-no-enmendar.component';
import { MejorasSolicitudDetalleComponent } from '../../../mejoras-solicitud-detalle/mejoras-solicitud-detalle.component';
/* tab validación */
import { InformeFavorableComponent } from '../../../../actos-admin/3_informe-favorable/informe-favorable.component';
import { InformeFavorableConRequerimientoComponent } from '../../../../actos-admin/4_informe-favorable-con-requerimiento/informe-favorable-con-requerimiento.component';
import { InformeDesfavorableComponent } from '../../../../actos-admin/5_informe-desfavorable/informe-desfavorable.component';
import { InformeDesfavorableConRequerimientoComponent } from '../../../../actos-admin/6_informe-desfavorable-con-requerimiento/informe-desfavorable-con-requerimiento.component';
import { PrProvisionalFavorableComponent } from '../../../../actos-admin/7_pr-provisional-favorable/pr-provisional-favorable.component';
import { PrProvisionalFavorableConRequerimientoComponent } from '../../../../actos-admin/8_pr-provisional-favorable-con-requerimiento/pr-provisional-favorable-con-requerimiento.component';
import { PrProvisionalDesfavorableComponent } from '../../../../actos-admin/9_pr-provisional-desfavorable/pr-provisional-desfavorable.component';
import { PrProvisionalDesfavorableConRequerimientoComponent } from '../../../../actos-admin/10_pr-provisional-desfavorable-con-requerimiento/pr-provisional-desfavorable-con-requerimiento.component';
import { PrDefinitivaFavorableComponent } from '../../../../actos-admin/11_pr-definitiva-favorable/pr-definitiva-favorable.component';
import { PrDefinitivaFavorableConRequerimientoComponent } from '../../../../actos-admin/12_pr-definitiva-favorable-con-requerimiento/pr-definitiva-favorable-con-requerimiento.component';
import { PrDefinitivaDesfavorableComponent } from '../../../../actos-admin/13_pr-definitiva-desfavorable/pr-definitiva-desfavorable.component';
import { PrDefinitivaDesfavorableConRequerimientoComponent } from '../../../../actos-admin/14_pr-definitiva-desfavorable-con-requerimiento/pr-definitiva-desfavorable-con-requerimiento.component';
import { ResolConcesionFavorableComponent } from '../../../../actos-admin/15_resolucion-concesion/resol-concesion-favorable.component';
import { ResolConcesionFavorableConRequerimientoComponent } from '../../../../actos-admin/16_resol-concesion-con-requerimiento/resol-concesion-favorable-con-requerimiento.component';
import { ResolDenegacionComponent } from '../../../../actos-admin/17_resolucion-denegacion/resol-denegacion.component';
import { ResolDenegacionConRequerimientoComponent } from '../../../../actos-admin/18_resolucion-denegacion-con-requerimiento/resol-denegacion-con-requerimiento.component';
/* tab ejecución */
import { ActaDeKickOffComponent } from '../../../../actos-admin/19_acta-de-kick-off/acta-de-kick-off.component';
import { ActaDeCierreComponent } from '../../../../actos-admin/20_acta-de-cierre/acta-de-cierre.component';
/* tab justificación */
import { InformeInicioReqJustificacionComponent } from '../../../../actos-admin/21_informe-inicio-requerimiento-justificacion/informe-inicio-req-justificacion.component';
import { ReqEnmiendaJustificacionComponent } from '../../../../actos-admin/22_requerimiento-enmienda-justificacion/req-enmienda-justificacion.component';
import { InformePostEnmiendaJustificacionComponent } from '../../../../actos-admin/23_informe-post-enmienda-justificacion/informe-post-enmienda-justificacion.component';
import { ResolDePagoComponent } from '../../../../actos-admin/24_resolucion-de-pago/resol-de-pago.component';
/* tab desestimiento o renuncia */
import { ResolDesestimientoPorRenunciaComponent } from '../../../../actos-admin/25_resolucion-desestimiento-por-renuncia/resol-desestimiento-por-renuncia.component';
import { PrRevocacionPorNoJustificarComponent } from '../../../../actos-admin/26_pr-revocacion-por-no-justificar/pr-revocacion-por-no-justificar.component';
import { ResolRevocacionPorNoJustificarComponent } from '../../../../actos-admin/27_resolucion-revocacion-por-no-justificar/resol-revocacion-por-no-justificar.component';
import { DeclaracionResponsableComponent } from '../../../../actos-admin/28_declaracion-responsable/declaracion-responsable.component';
import { MailService } from '../../../../Services/mail.service';

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
    CommonModule, DocumentComponent, RequerimientoComponent, ResolDesestimientoNoEnmendarComponent, MejorasSolicitudDetalleComponent, InformeFavorableComponent,
    InformeFavorableConRequerimientoComponent, InformeDesfavorableComponent, InformeDesfavorableConRequerimientoComponent, PrProvisionalFavorableComponent,
    PrProvisionalFavorableConRequerimientoComponent, PrProvisionalDesfavorableComponent, PrProvisionalDesfavorableConRequerimientoComponent, PrDefinitivaFavorableComponent,
    PrDefinitivaFavorableConRequerimientoComponent, PrDefinitivaDesfavorableComponent, PrDefinitivaDesfavorableConRequerimientoComponent, ResolConcesionFavorableComponent,
    ResolConcesionFavorableConRequerimientoComponent, ResolDenegacionComponent, ResolDenegacionConRequerimientoComponent, ActaDeKickOffComponent, ActaDeCierreComponent,
    InformeInicioReqJustificacionComponent, ReqEnmiendaJustificacionComponent, InformePostEnmiendaJustificacionComponent, ResolDePagoComponent,
    ResolDesestimientoPorRenunciaComponent, PrRevocacionPorNoJustificarComponent, ResolRevocacionPorNoJustificarComponent,
    ReactiveFormsModule, MatButtonModule, MatCheckboxModule, MatRadioModule,
    MatFormFieldModule, MatTabsModule,
    MatInputModule, TranslateModule, MatSelectModule, MatExpansionModule,
    MatCardModule, MatSnackBarModule, MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule, MatListModule,
    DeclaracionResponsableComponent
  ]
})

export class XecsDetailExpedComponent {
  private route = inject(ActivatedRoute);
  public fb = inject(FormBuilder);
  private expedienteService = inject(ExpedienteService);
  noRequestReasonText:boolean = true
  selectedIndex: number | undefined;

  form!: FormGroup
  idExpediente!: number
  actualNif!: string
  actualID!: number
  actualIdExp!: number
  actualEmpresa: string = ""
  actualTimeStamp: string = ""
  actualConvocatoria!: number
  actualTipoTramite: string = ""
  actualFechaSolicitud: string = ""
  actualImporteSolicitud: number = 0
  actualFechaRec: string = ""
  actualRef_REC: string = ""
  actualFechaNotifReq: string = ""
  totalSolicitudesPrevias!: number
  importeAyuda: number = 0
  signedDocData!: DocSignedDTO
  externalSignUrl: string = ""
  sendedUserToSign: string = ""
  sendedDateToSign!: Date 
  publicAccessId: string = ""
  telefono_rep: string | undefined
  email_rep: string | undefined
  motivoRequerimiento: string = ""
  motivoDenegacion: string = ""
  reqGenerado: boolean = false
  lineaXecsConfig: PindustLineaAyudaDTO[] = []

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
                    publicAccessId: '-'
  }
  
  lastInsertId: number | undefined
  newAidAmount: number | undefined
  nifDocgenerado: string = ""
  timeStampDocGenerado: string = ""
  nameDocgenerado: string = ""
  pdfUrl: SafeResourceUrl | null = null
  imageUrl: SafeUrl | undefined
  showPdfViewer: boolean = false
  showImageViewer: boolean = false

  loading: boolean = false;
  response?: SignatureResponse;
  error?: string;

  situations: any[] = [];

  motivoDesestimientoRenuncia: string = ""
  justificationSendedMail!: Date

  constructor( private commonService: CommonService, private adapter: DateAdapter<any>,  private sanitizer: DomSanitizer,
              private viafirmaService: ViafirmaService, private lineaXecsService: PindustLineaAyudaService, private mailService: MailService
              ) {
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
    motivoRequerimiento:[{ value: '', disabled: false }],
    /* Validación */
    fecha_infor_fav_desf: [{ value: '', disabled: true }],
    fecha_firma_propuesta_resolucion_prov: [{ value: '', disabled: true }],
    fecha_not_propuesta_resolucion_prov: [{ value: '', disabled: true }],
    propuesta_resolucion_favorable: [{ disabled: true }],
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
    ref_REC_amp_termino: [{ value: '', disabled: true }, [Validators.minLength(16), Validators.maxLength(16)]],
    fecha_amp_termino: [{ value: '', disabled: true }],
    justificationSendedMail: [{ value: '', disabled: false}, []],
    /* Justificación */
    fecha_REC_justificacion: [{ value: '', disabled: true }],
    ref_REC_justificacion: [{ value: '', disabled: true }, [Validators.minLength(16), Validators.maxLength(16)]],
    fecha_firma_res_pago_just: [{ value: '', disabled: true }],
    fecha_not_res_pago: [{ value: '', disabled: true }],
    fecha_firma_requerimiento_justificacion: [{ value: '', disabled: true }],
    fecha_not_req_just: [{ value: '', disabled: true }],
    fecha_REC_requerimiento_justificacion: [{ value: '', disabled: true }],
    ref_REC_requerimiento_justificacion: [{ value: '', disabled: true }, [Validators.minLength(16), Validators.maxLength(16)]],
    fecha_propuesta_rev: [{ value: '', disabled: true }],
    fecha_resolucion_rev: [{ value: '', disabled: true }],
    /* Desestimiento o renuncia */
    fecha_REC_desestimiento: [{ value: '', disabled: true }],
    ref_REC_desestimiento: [{ value: '', disabled: true }, [Validators.minLength(16), Validators.maxLength(16)]],
    fecha_firma_resolucion_desestimiento: [{ value: '', disabled: true }],
    fecha_notificacion_desestimiento: [{ value: '', disabled: true }],   
    motivoDesestimientoRenuncia: [{ value: '', disabled: false}, []]
  });
  const tabIndex = sessionStorage.getItem('currentContactTab');
  this.selectedIndex = tabIndex !== null ? Number(tabIndex) : undefined;

  this.commonService.getSituations().subscribe((situations: any[]) => {
    this.situations = situations;
  })

  // Si se añade 'fecha_de_pago' cambia a SI el valor del campo ordenDePago
  this.form.get('fecha_de_pago')?.valueChanges.subscribe(value => {
    const ordenDePagoControl = this.form.get('ordenDePago');
    if (value) {
      ordenDePagoControl?.setValue('SI');
    } else {
      ordenDePagoControl?.setValue('NO');
    }
  });
  
  // Actualizar fecha_limite_consultoria según 'Meses Fecha límite consultoría'
  this.form.get('fecha_kick_off')?.valueChanges.subscribe(value => {
  if (value) {
    const fecha = new Date(value);

    this.commonService.getLineDetail(this.actualConvocatoria)
      .subscribe((meses: string | undefined) => {
        if (!meses) {
          console.log('No hay meses límite consultoría disponibles');
          return;
        }

        const partes = meses.split('#');

        const parteFiltrada = partes.find(parte => {
          try {
            const obj = JSON.parse(parte.replace(/'/g, '"'));
            return obj.programa === this.actualTipoTramite;
          } catch (e) {
            console.error('Error parsing JSON:', parte, e);
            return false;
          }
        });

        if (parteFiltrada) {
          const objFiltrado = JSON.parse(parteFiltrada.replace(/'/g, '"'));
          // Convertir intervalo a número
          const mesesSumar = parseInt(objFiltrado.intervalo, 10);
          if (!isNaN(mesesSumar)) {
            fecha.setMonth(fecha.getMonth() + mesesSumar);
          } else {
            console.warn('Intervalo no es un número válido:', objFiltrado.intervalo);
          }
          // Convertir a yyyy-MM-dd para el input type="date"
          const iso = fecha.toISOString().substring(0, 10);
          this.form.get('fecha_limite_consultoria')?.setValue(iso, { emitEvent: false });
        } else {
          console.log('No se encontró el programa', this.actualTipoTramite);
        }
      });
  }
  });

  // Se actualiza fecha_limite_justificacion sumando 20 días 
  this.form.get('fecha_reunion_cierre')?.valueChanges.subscribe(value => {
    if (!value || isNaN(new Date(value).getTime())) {
      return;
    };
 
  const fecha_limite_justificacion = new Date(value);
    fecha_limite_justificacion.setDate(fecha_limite_justificacion.getDate() + 20);
    this.form.get('fecha_limite_justificacion')?.setValue(fecha_limite_justificacion.toISOString().split('T')[0]);
  })
  
  this.getExpedDetail(this.idExpediente)
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
        // quitar la parte '00:00:00' que aparece en algunas fechas del entorno producción
        expediente.fecha_reunion_cierre = expediente.fecha_reunion_cierre.split(" ")[0]; 
        expediente.fecha_limite_consultoria = expediente.fecha_limite_consultoria.split(" ")[0];
        expediente.fecha_requerimiento = expediente.fecha_requerimiento.split(" ")[0];
        expediente.fecha_requerimiento_notif = expediente.fecha_requerimiento_notif.split(" ")[0];
        expediente.fecha_notificacion_resolucion = expediente.fecha_notificacion_resolucion.split(" ")[0];
        expediente.fecha_max_desp_ampliacion = expediente.fecha_max_desp_ampliacion.split(" ")[0];
        expediente.fecha_amp_termino = expediente.fecha_amp_termino.split(" ")[0];
        expediente.fecha_infor_fav_desf = expediente.fecha_infor_fav_desf.split(" ")[0];
        expediente.fecha_de_pago = expediente.fecha_de_pago.split(" ")[0];
        expediente.fecha_limite_justificacion = expediente.fecha_limite_justificacion.split(" ")[0];
        expediente.fecha_firma_requerimiento_justificacion = expediente.fecha_firma_requerimiento_justificacion.split(" ")[0];
        expediente.fecha_firma_resolucion_desestimiento = expediente.fecha_firma_resolucion_desestimiento.split(" ")[0];
        expediente.fecha_notificacion_desestimiento = expediente.fecha_notificacion_desestimiento.split(" ")[0];
        
        this.form.patchValue(expediente);
        this.actualNif = expediente.nif
        this.actualID = expediente.id
        this.actualIdExp = expediente.idExp
        this.actualEmpresa = expediente.empresa
        this.actualTimeStamp = expediente.selloDeTiempo	
        this.actualConvocatoria = expediente.convocatoria
        this.actualTipoTramite = expediente.tipo_tramite
        this.actualFechaSolicitud = expediente.fecha_solicitud
        this.actualImporteSolicitud = expediente.importeAyuda
        this.actualFechaRec = expediente.fecha_REC
        this.actualRef_REC = expediente.ref_REC
        this.actualFechaNotifReq = expediente.fecha_requerimiento_notif
        this.publicAccessId = expediente.PublicAccessId
        this.email_rep = expediente.email_rep
        this.telefono_rep = expediente.telefono_rep
        this.motivoRequerimiento = expediente.motivoRequerimiento
        this.motivoDenegacion = expediente.motivoDenegacion
        this.motivoDesestimientoRenuncia = expediente.motivoDesestimientoRenuncia
        this.justificationSendedMail = expediente.justificationSendedMail
        if (this.publicAccessId) {
          this.checkViafirmaSign(this.publicAccessId)
        }
        
        this.commonService.showSnackBar('✅ Expediente cargado correctamente.');
        this.getTotalNumberOfApplications(this.actualNif, this.actualTipoTramite, this.actualConvocatoria)
      } else {
        this.commonService.showSnackBar('⚠️ No se encontró información del expediente.');
      }
    });
}

enableEdit(): void {
  // Lista de campos que deben permanecer bloqueados al activar el EDIT del detalle de la solicitud
  const readOnlyFields = [
    'nif',
    'tipo_tramite',
    'importeAyuda',
    'fecha_solicitud',
    'ordenDePago',
    'fecha_limite_justificacion',
    'fecha_limite_consultoria', 'fecha_firma_propuesta_resolucion_def'
  ];

  Object.entries(this.form.controls).forEach(([controlName, control]) => {
    const isReadOnly = readOnlyFields.includes(controlName);
    const element = document.querySelector<HTMLInputElement>(`[formControlName="${controlName}"]`);

    if (isReadOnly) {
      control.disable({ emitEvent: false });
      element?.setAttribute('readonly', 'true');
    } else {
      control.enable({ emitEvent: false });
      element?.removeAttribute('readonly');
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
        this.commonService.showSnackBar(`Ha ocurrido un error al consultar documento de la firma.\nCódigo: ${error.status}\nMensaje: ${errorMsg}`);
      }
    }
  );
}

calculateAidAmount() {
  this.lineaXecsService.getAll().subscribe(
    (lineaAyudaItems: PindustLineaAyudaDTO[]) => {
      this.lineaXecsConfig = lineaAyudaItems.filter((item: PindustLineaAyudaDTO) => {
        return item.convocatoria === this.actualConvocatoria && item.lineaAyuda === "XECS" && item.activeLineData === "SI";
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

onTabChange(event: MatTabChangeEvent) {
  sessionStorage.setItem('currentContactTab', event.index.toString());
}

changeExpedSituation(event: any) {
  const fecha = (event.target as HTMLInputElement).value;
  if (fecha) {
    // Actualizamos la situación a 'emitirIFPRProvPago'
    this.expedienteService
      .updateFieldExpediente(this.actualID, 'situacion', 'notificadoIFPRProvPago')
      .subscribe({
        next: (newState: any) => {
          console.log (newState)
          this.commonService.showSnackBar('Situación actualizada a: ' + newState.data.situacion);
          // Opcional: actualizar también el formulario si quieres reflejar el valor
          this.form.patchValue({ situacion: 'notificadoIFPRProvPago' });
        },
        error: (err) => {
          console.error('Error al actualizar situación:', err);
        }
      });
  }
}

sendJustificationMail(expediente: any): void {
  const confirmed = window.confirm("¿Quieres enviar el correo electrónico para la justificación de XECS?");
  if (!confirmed) {
    this.commonService.showSnackBar("Envío cancelado");
    return;
  }

  // ✅ Usuario confirmó → enviar correo
  this.mailService.sendJustificationMail(expediente)
    .subscribe({
      next: (response: any) => {
          console.log("response", response);
          this.commonService.showSnackBar(response.message);
      },
      error: (err) => {
        console.error("Error enviando correo", err);
        this.commonService.showSnackBar('Error enviando el correo');
        }
      });
}
}