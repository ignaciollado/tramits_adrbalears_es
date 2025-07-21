import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { ExpedienteService } from '../../../../Services/expediente.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';
import { DocumentComponent } from '../../../../document/document.component';
import { CommonService } from '../../../../Services/common.service';

@Component({
  selector: 'app-detalle-expediente',
  standalone: true,
  templateUrl: './detail-exped.component.html',
  styleUrl: './detail-exped.component.scss',

  imports: [
    CommonModule, DocumentComponent,
    ReactiveFormsModule, MatButtonModule, MatCheckboxModule,
    MatFormFieldModule, MatTabsModule,
    MatInputModule, TranslateModule,
    MatCardModule, MatSnackBarModule,
  ]
})
export class XecsDetailExpedComponent {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private expedienteService = inject(ExpedienteService);

  form!: FormGroup
  idExpediente!: number
  actualNif!: string
  actualTimeStamp!: string
  actualConvocatoria!: number
  actualTipoTramite!: string

  constructor( private commonService: CommonService ) {}

ngOnInit(): void {
  this.idExpediente = +this.route.snapshot.paramMap.get('id')!;

  this.form = this.fb.group({
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
    fechaEnvioAdministracion: [{ value: '', disabled: true }],
    fecha_de_pago: [{ value: '', disabled: true }],
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
    cc_datos_bancarios: [{ value: '', disabled: true }]
  });
  this.getExpedDetail(this.idExpediente);
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
        this.actualTimeStamp = expediente.selloDeTiempo	
        this.actualConvocatoria = expediente.convocatoria
        this.actualTipoTramite = expediente.tipo_tramite
        this.commonService.showSnackBar('✅ Expediente cargado correctamente.');
         this.getTotalNumberOfApplications(this.actualNif, this.actualTipoTramite, this.actualConvocatoria)
      } else {
        this.commonService.showSnackBar('⚠️ No se encontró información del expediente.');
      }
    });
}

enableEdit(): void {
  Object.keys(this.form.controls).forEach(controlName => {
    if ((controlName !== 'nif') && (controlName !== 'tipo_tramite')) {
      this.form.get(controlName)?.enable();
    } else {
      this.form.get(controlName)?.disable();
    }
  });
}

saveExpediente(): void {
  const expedienteActualizado = this.form.getRawValue();

  this.expedienteService.updateExpediente(this.idExpediente, expedienteActualizado)
    .subscribe({
      next: () => this.commonService.showSnackBar('✅ Expediente guardado correctamente.'),
      error: () => this.commonService.showSnackBar('❌ Error al guardar el expediente.')
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
        console.log (totalSolitudes.data.totalConvos)
        this.commonService.showSnackBar('✅ Solcitudes encontradas: '+totalSolitudes.data.totalConvos);
      } else {
        this.commonService.showSnackBar('⚠️ No se encontró información sobre el número de solicitudes.');
      }
    });
}
}
