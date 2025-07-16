import { ChangeDetectionStrategy, Component, viewChild, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormControl, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { map, Observable, of, startWith, throwError } from 'rxjs';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule, MatAccordion } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialog, MatDialogConfig, MatDialogModule } from '@angular/material/dialog';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { PopUpDialogComponent } from '../../popup-dialog/popup-dialog.component';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { ZipCodesIBDTO } from '../../Models/zip-codes-ib.dto';
import { CommonService } from '../../Services/common.service';
import { DocumentService } from '../../Services/document.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NifValidatorService } from '../../Services/nif-validator-service';
import { CnaeDTO } from '../../Models/cnae.dto';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { from } from 'rxjs';
import { catchError, concatMap, last, tap } from 'rxjs/operators';
import { XecsProgramsDTO } from '../../Models/xecs-programs-dto';
import { AuthorizationTextDTO } from '../../Models/authorization-texts-dto';
import { ResponsabilityDeclarationDTO } from '../../Models/responsability-declaration-dto';
import { ExpedienteService } from '../../Services/expediente.service';
import { ExpedienteDocumentoService } from '../../Services/expediente.documento.service';

@Component({
  selector: 'app-grant-application-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatSelectModule, MatExpansionModule, MatAutocompleteModule, 
    MatAccordion, MatIconModule, MatDatepickerModule, MatCheckboxModule, MatRadioModule, MatDialogModule, TranslateModule, MatProgressBarModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
  templateUrl: './grant-application-form.component.html',
  styleUrl: './grant-application-form.component.scss',
})

export class GrantApplicationFormComponent {
  readonly dialog = inject(MatDialog)
  htmlContentRequiredDocs: string = ''
  step = signal(0)
  uploadProgress: number = 0
  xecsForm: FormGroup  
  accordion = viewChild.required(MatAccordion)
  rgpdAccepted:boolean = false
  documentoYaEnADR:boolean = false
  introText: string = "getting intro text..."
  filteredcpostals: Observable<ZipCodesIBDTO[]> | undefined
  cpostals: ZipCodesIBDTO[] = []
  cnaes: CnaeDTO[] = []
  xecsPrograms: XecsProgramsDTO[] = []
  responsibilityDeclarations: ResponsabilityDeclarationDTO[] = []
  authorizations: AuthorizationTextDTO[] = []
  filesToUploadOptional: string[] = []  // new
  lastID: number = 0

  constructor ( private fb: FormBuilder, 
    private commonService: CommonService, 
    private expedienteService: ExpedienteService,
    private documentosExpedienteService: ExpedienteDocumentoService,
    private documentService: DocumentService,
    private nifValidator: NifValidatorService, 
    private snackBar: MatSnackBar ) {

  this.xecsForm = this.fb.group ({
    id_sol: this.fb.control(0),
    idExp: this.fb.control(0),
    selloDeTiempo: this.fb.control(''),
    opc_programa: this.fb.array([], Validators.required),
    nif: this.fb.control({value:'', disabled: true}, [Validators.required]),
    empresa: this.fb.control('', ),
    domicilio: this.fb.control({value: '', disabled: false}, ),
    cpostal: this.fb.control ('', [ Validators.pattern('^07[0-9]{3}$')]),
    localidad: this.fb.control({value: '', disabled: true}, ),
    iae: this.fb.control({value: '', disabled: false}, ),
    telefono: this.fb.control('', [Validators.pattern('^[0-9]{9}$')]),
    acceptRGPD: this.fb.control<boolean | null>(false, Validators.required),
    tipo_tramite: this.fb.control<string | null>(null, Validators.required),
    tipo_solicitante: this.fb.control<string | null>(null, Validators.required),
    nom_representante:  this.fb.control<string | null>({value: '', disabled: true}),
    nif_representante: this.fb.control<string | null>({value: '', disabled: true}, [Validators.pattern('^[0-9]+[A-Za-z]$')]),
    telefono_rep: this.fb.control<string | null>('', [Validators.pattern('^[0-9]{9}$')]),
    email_rep: this.fb.control<string | null>('', [Validators.email]),
    empresa_consultor: this.fb.control<string | null>(''),
    nom_consultor: this.fb.control<string | null>(''),
    tel_consultor: this.fb.control<string | null>('', Validators.pattern('^[0-9]{9}$')),
    mail_consultor: this.fb.control<string | null>('', Validators.email),
    fecha_completado: this.fb.control(this.commonService.getCurrentDateTime()),

    memoriaTecnicaEnIDI: this.fb.control<boolean | null>(false, Validators.required),
    file_memoriaTecnica: this.fb.control<File | null>(null, Validators.required),
    file_certificadoIAE: this.fb.control<File | null>(null, Validators.required),
    file_nifEmpresa: this.fb.control<File | null>(null, Validators.required),
    pJuridicaDocAcreditativaEnIDI: this.fb.control<boolean | null>(false, Validators.required),
    file_escritura_empresa: this.fb.control<File | null>(null, Validators.required),

    file_document_acred_como_repres: this.fb.control<File | null>(null, Validators.required),
    file_certificadoAEAT: this.fb.control<File | null>(null, Validators.required),
    copiaNIFSociedadEnIDI: this.fb.control<boolean | null>(false, Validators.required),
    /* AUTORIZACIONES */
    consentimientocopiaNIF: this.fb.control<boolean | null>(true, Validators.required),  /* SI NO file_copiaNIF de la tabla pindust_expediente */
    file_copiaNIF: this.fb.control<File | null>(null),
    consentimiento_certificadoATIB: this.fb.control<boolean | null>(true, Validators.required),  /* SI NO file_certificadoATIB de la tabla pindust_expediente*/
    file_certificadoATIB: this.fb.control<File | null>(null), 
    consentimiento_certificadoSegSoc: this.fb.control<boolean | null>(true, Validators.required), /* SI NO file_certificadoSegSoc de la tabla pindust_expediente*/
    file_certificadoSegSoc: this.fb.control<File | null>(null),

    nom_entidad: this.fb.control<string | null>('', ),
    domicilio_sucursal: this.fb.control<string | null>('', ),
    codigo_BIC_SWIFT: this.fb.control<string | null>('', [ Validators.minLength(11), Validators.maxLength(11), Validators.pattern(/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/)]),
    opcion_banco: this.fb.control<string | null>('', ),
    cc_datos_bancarios: this.fb.control<string | null>({value: '', disabled: true}, [ Validators.minLength(25), Validators.maxLength(25), Validators.pattern(/^\S*$/)]),

    declaracion_responsable_i: this.fb.control<boolean | null>({ value: true, disabled: true }),
    declaracion_responsable_ii: this.fb.control<boolean | null>({ value: false, disabled: false }),
    importe_minimis: this.fb.control<string | null>('', [Validators.required,this.twoDecimalValidator()]),

    declaracion_responsable_iv: this.fb.control<boolean | null>({ value: true, disabled: true }),
    declaracion_responsable_v: this.fb.control<boolean | null>({ value: true, disabled: true }),
    declaracion_responsable_vi: this.fb.control<boolean | null>({ value: true, disabled: true }),
    declaracion_responsable_vii: this.fb.control<boolean | null>({ value: true, disabled: true }),
    declaracion_responsable_viii: this.fb.control<boolean | null>({ value: true, disabled: true }),
    declaracion_responsable_ix: this.fb.control<boolean | null>({ value: true, disabled: true }),
    declaracion_responsable_x: this.fb.control<boolean | null>({ value: true, disabled: true }),
    declaracion_responsable_xi: this.fb.control<boolean | null>({ value: true, disabled: true }),
  });
}

ngOnInit(): void {

 this.xecsForm.get('acceptRGPD')?.valueChanges.subscribe((value: boolean) => {
 this.rgpdAccepted = value;
 });
    
this.filteredcpostals = this.xecsForm.get('cpostal')!.valueChanges.pipe(
  startWith(''),
  map(value => {
    const input = typeof value === 'string' ? value : value?.cpostal || '';
    return input ? this._filter(input) : this.cpostals.slice();
  })
);

const nifControl = this.xecsForm.get('nif')
const nom_representanteControl = this.xecsForm.get('nom_representante')
const nif_representanteControl = this.xecsForm.get('nif_representante')
const opcionBancoControl = this.xecsForm.get('opcion_banco')
const ccControl = this.xecsForm.get('cc_datos_bancarios')
const codigo_BIC_SWIFTControl = this.xecsForm.get('codigo_BIC_SWIFT')

opcionBancoControl?.valueChanges.subscribe((valor) => {
 
  ccControl?.enable()
  ccControl?.setValue(''); // Limpia el campo al cambiar de opción

 if (valor === '1') {
 // Patrón para IBAN español (por ejemplo: empieza por ES y 22 dígitos)
  ccControl?.setValidators([
  Validators.required,
  Validators.minLength(25),
  Validators.maxLength(25),
  Validators.pattern(/^ES\d{23}$/)
 ]);
 
  ccControl?.valueChanges.subscribe((inputValue: string) => {
    if (inputValue && !inputValue.startsWith('ES')) {
      ccControl?.setValue('ES' + inputValue, { emitEvent: false });
    }
  });

 } else if (valor === '2') {
 // Patrón para cuentas internacionales (ejemplo genérico sin espacios)
  ccControl?.setValidators([
  Validators.required,
  Validators.minLength(25),
  Validators.maxLength(25),
  Validators.pattern(/^\S+$/)
 ]);
 }
  ccControl?.updateValueAndValidity();
});

nifControl?.valueChanges.subscribe((valor) => {
  nifControl.setValue(valor.toUpperCase(), { emitEvent: false });
})

nif_representanteControl?.valueChanges.subscribe((valor) => {
  nif_representanteControl.setValue(valor.toUpperCase(), { emitEvent: false });
})

ccControl?.valueChanges.subscribe((valor) => {
 if (opcionBancoControl?.value === '1' && valor !== valor?.toUpperCase()) {
    ccControl.setValue(valor.toUpperCase(), { emitEvent: false });
 }
});

codigo_BIC_SWIFTControl?.valueChanges.subscribe((valor) => {
  codigo_BIC_SWIFTControl.setValue(valor.toUpperCase(), { emitEvent: false });
});


this.xecsForm.get('tipo_solicitante')?.valueChanges.subscribe(value => {
 nifControl?.enable()

 if (!nifControl) return;

 // Limpia validadores anteriores
 nifControl.clearValidators();

 if (value === 'autonomo') {
 nifControl.setValidators([
 Validators.required,
 Validators.minLength(9),
 Validators.maxLength(9),
 this.nifValidator.validateDniNie()
 ]);
  nom_representanteControl?.disable()
  nif_representanteControl?.disable()
 } else {
 nifControl.setValidators([
 Validators.required,
 Validators.minLength(9),
 Validators.maxLength(9),
 this.nifValidator.validateCif()
 ]);
  nom_representanteControl?.enable()
  nif_representanteControl?.enable()
 }

 nifControl.updateValueAndValidity();
});

this.getAllcpostals()
this.getAllCnaes()
this.getAllXecsPrograms()
this.getResponsabilityDeclarations()
this.getDocumentationAndAuthorizations()
}

setStep(index: number) {
  this.step.set(index);
}

get placeholderNif(): string {
  const tipo = this.xecsForm.get('tipo_solicitante')?.value;
  if (tipo === 'autonomo') {
    return 'Introduzca su DNI o NIE';
  } else if (tipo === 'pequenya' || tipo === 'mediana') {
    return 'Introduzca el CIF de la empresa';
  }
  return "Seleccione el 'Tipo de solicitante' y, luego, introduzca el NIF";
}


twoDecimalValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    const regex = /^\d+([.,]\d{2})$/;
    return value && !regex.test(value) ? { invalidDecimal: true } : null;
  };
}

file_memoriaTecnicaToUpload: File[] = []              // required and maybe in ADR
file_certificadoIAEToUpload: File[] = []              // required
file_nifEmpresaToUpload: File[] = []                  // required and maybe in ADR
file_escritura_empresaToUpload: File[] = []           // required and maybe in ADR
file_document_acred_como_represToUpload: File[] = []  // required
file_certificadoAEATToUpload: File[] = []             // required

file_copiaNIFToUpload: File[] = []                    // optional
file_certificadoATIBToUpload: File[] = []             // optional
file_certificadoSegSocToUpload: File[] = []           // optional

onSubmit(): void {
  const datos = this.xecsForm.value;
  const timeStamp = this.commonService.generateCustomTimestamp();
  const convocatoria = new Date().getFullYear();

  this.expedienteService.getLastExpedienteIdXECS(convocatoria).subscribe((lastID: any) => {
    datos.idExp = (+lastID.last_id) + 1
    datos.convocatoria = convocatoria
    datos.localidad = datos.cpostal
    datos.selloDeTiempo = timeStamp
    datos.tipo_tramite = datos.tipo_tramite.replace(/_/g, ' ')
    datos.file_copiaNIF = datos.consentimientocopiaNIF
    datos.file_certificadoATIB = datos.consentimiento_certificadoATIB
    datos.file_certificadoSegSoc = datos.consentimiento_certificadoSegSoc

    // Eliminar campos no necesarios
    delete datos.id_sol;
    delete datos.opc_programa;
    delete datos.acceptRGPD;
    delete datos.consentimientocopiaNIF;
    delete datos.consentimiento_certificadoATIB;
    delete datos.consentimiento_certificadoSegSoc;
    delete datos.declaracion_responsable_ii;

    // Agrupar archivos REQUIRED por tipo
    const filesToUpload = [
      { files: this.file_memoriaTecnicaToUpload, type: 'file_memoriaTecnica' },
      { files: this.file_certificadoIAEToUpload, type: 'file_certificadoIAE' },
      { files: this.file_nifEmpresaToUpload, type: 'file_nifEmpresa' },
      { files: this.file_escritura_empresaToUpload, type: 'file_escritura_empresa' },
      { files: this.file_document_acred_como_represToUpload, type: 'file_document_acred_como_repres' },
      { files: this.file_certificadoAEATToUpload, type: 'file_certificadoAEAT' }
    ];

    this.expedienteService.createExpediente(datos).subscribe({
      next: (resp) => {
        datos.id_sol = resp.id_sol;
        this.showSnackBar('✔️ Expediente creado con éxito ' + resp.message + ' ' + resp.id_sol);

        // Validación y aplanado de archivos
        const archivosValidos = filesToUpload.flatMap(({ files, type }) => {
          if (!files || files.length === 0) return [];

          return Array.from(files).flatMap((file: File) => {
            if (!file) return [];
            if (file.size === 0) {
              this.showSnackBar(`⚠️ El archivo "${file.name}" está vacío y no se subirá.`);
              return [];
            }
            if (file.size > 10 * 1024 * 1024) {
              this.showSnackBar(`⚠️ El archivo "${file.name}" supera el tamaño máximo permitido de 10 MB.`);
              return [];
            }
            return [{ file, type }];
          });
        });

        console.log ("archivosValidos", archivosValidos.length)
        if (archivosValidos.length === 0) {
          this.showSnackBar('⚠️ No hay archivos válidos para subir.');
          return;
        }

        // Subida secuencial de archivos válidos
        from(archivosValidos)
          .pipe(
            concatMap(({ file, type }) =>
              this.documentosExpedienteService.createDocumentoExpediente([file], datos, type).pipe(
                concatMap(() => this.uploadTheFile(timeStamp, [file]))
              )
            )
          )
          .subscribe({
            next: (event) => {
              let mensaje = `📤 ${event.message || 'Subida exitosa'}\n`;
              if (Array.isArray(event.file_name)) {
                event.file_name.forEach((file: any) => {
                  mensaje += `🗂️ Archivo: ${file.name}\n📁 Ruta: ${file.path}\n`;
                });
              } else {
                mensaje += `⚠️ No se encontró información de archivo en el evento.`;
              }
              this.showSnackBar(mensaje);
            },
            complete: () => this.showSnackBar('✅ Todas las subidas finalizadas'),
            error: (err) => this.showSnackBar(`❌ Error durante la secuencia de subida: ${err}`)
          });
      },
      error: (err) => {
        let msg = '❌ Error al crear el expediente.\n';
        console.log("err", err);
        try {
          const errorMsgObj = JSON.parse(err.messages?.error ?? '{}');
          msg += `💬 ${errorMsgObj.message || 'Se produjo un error inesperado.'}\n`;

          const erroresDetallados = errorMsgObj.errores_detallados;
          if (erroresDetallados) {
            msg += '🔍 Errores detallados:\n';
            Object.entries(erroresDetallados).forEach(([campo, errorCampo]) => {
              msg += ` • ${campo}: ${errorCampo}\n`;
            });
          }

          const datosRecibidos = errorMsgObj.datos_recibidos;
          if (datosRecibidos) {
            msg += '📦 Datos recibidos:\n';
            Object.entries(datosRecibidos).forEach(([key, value]) => {
              msg += ` - ${key}: ${Array.isArray(value) ? value.join(', ') : value}\n`;
            });
          }
        } catch (parseError) {
          msg += `⚠️ No se pudo interpretar el error: ${err}`;
        }
        this.showSnackBar(msg);
      }
    });
  });
}



/* required files to upload */
get memoriaTecnicaFileNames(): string {
  return this.file_memoriaTecnicaToUpload.map(f => f.name).join(', ')
}
onFileMemoriaTecnicaChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    this.file_memoriaTecnicaToUpload = Array.from(input.files);
    console.log ("this.file_memoriaTecnicaToUpload", this.file_memoriaTecnicaToUpload)
  }
}
get certificadoIAEFileNames(): string {
  return this.file_certificadoIAEToUpload.map(f => f.name).join(', ')
}
onFileCertificadoIAEChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    this.file_certificadoIAEToUpload = Array.from(input.files);
    console.log ("this.file_certificadoIAEToUpload", this.file_certificadoIAEToUpload)
  }
}
get nifEmpresaFileNames(): string {
  return this.file_nifEmpresaToUpload.map(f => f.name).join(', ')
}
onFileNifEmpresaChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    this.file_nifEmpresaToUpload = Array.from(input.files);
    console.log ("this.file_nifEmpresaToUpload", this.file_nifEmpresaToUpload)
  }
}
get escrituraPublicaFileNames(): string {
  return this.file_escritura_empresaToUpload.map(f => f.name).join(', ')
}
onFileEscrituraEmpresaChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    this.file_escritura_empresaToUpload = Array.from(input.files);
    console.log ("this.file_escritura_empresaToUpload", this.file_escritura_empresaToUpload)
  }
}
get docAcredRepresFileNames(): string {
  return this.file_document_acred_como_represToUpload.map(f => f.name).join(', ')
}
onFileDocAcredRepresChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    this.file_document_acred_como_represToUpload = Array.from(input.files);
    console.log ("this.file_document_acred_como_represToUpload", this.file_document_acred_como_represToUpload)
  }
}
get certficadoAEATFileNames(): string {
  return this.file_certificadoAEATToUpload.map(f => f.name).join(', ')
}
onFilecertificadoAEATChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    this.file_certificadoAEATToUpload = Array.from(input.files);
    console.log ("this.file_certificadoAEATToUpload", this.file_certificadoAEATToUpload)
  }
}

/* optional files to upload */
get copiaNifFileNames(): string {
  return this.file_copiaNIFToUpload.map(f => f.name).join(', ')
}
onFileCopiaNifChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    this.file_copiaNIFToUpload = Array.from(input.files);
    console.log ("this.file_copiaNIFToUpload", this.file_copiaNIFToUpload)
  }
}
get certificadoATIBFileNames(): string {
  return this.file_certificadoATIBToUpload.map(f => f.name).join(', ')
}
onFilecertificadoATIBChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    this.file_certificadoATIBToUpload = Array.from(input.files);
    console.log ("this.file_certificadoATIBToUpload", this.file_certificadoATIBToUpload)
  }
}
get certificadoSegSocFileNames(): string {
  return this.file_certificadoSegSocToUpload.map(f => f.name).join(', ')
}
onFilecertificadoSegSocChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    this.file_certificadoSegSocToUpload = Array.from(input.files);
    console.log ("this.file_certificadoSegSocToUpload", this.file_certificadoSegSocToUpload)
  }
}

openDialog(enterAnimationDuration: string, exitAnimationDuration: string, questionText: string, toolTipText: string, doc1: string, doc2: string): void {
  const dialogConfig = new MatDialogConfig();
  dialogConfig.disableClose = false
  dialogConfig.autoFocus = true
  dialogConfig.panelClass = "dialog-customization"
  dialogConfig.backdropClass = "popupBackdropClass"
  dialogConfig.position = {
    'top': '10%',
    'left': '10%'
  };
  dialogConfig.width='90%',
  dialogConfig.data = {
    questionText: questionText, toolTipText: toolTipText, doc1: doc1, doc2: doc2
  };
  this.dialog.open(PopUpDialogComponent, dialogConfig);
}

onCheckboxChange(event: MatCheckboxChange) {
  const programsArray = this.xecsForm.get('opc_programa') as FormArray;

  if (event.checked) {
    programsArray.push(new FormControl(event.source.value));
  } else {
    const index = programsArray.controls.findIndex(ctrl => ctrl.value === event.source.value);
    if (index >= 0) {
      programsArray.removeAt(index);
    }
  }
}

onRadioChange(event: any): void {
  const programsArray = this.xecsForm.get('opc_programa') as FormArray;

  const valorSeleccionado = event.value;
  console.log('Valor seleccionado:', valorSeleccionado);

  // Aquí puedes hacer lo que necesites con el valor,
  // por ejemplo actualizar otro campo o activar lógica condicional.
  // Ejemplo:
  if (valorSeleccionado === 'ADR') {
    // activar algo especial para el programa ADR
    
  }
}

selectedZipValue(event: MatAutocompleteSelectedEvent): void {
  const selected = event.option.value;
  if (selected && selected.zipCode) {
    this.xecsForm.get('cpostal')?.setValue(selected.zipCode, { emitEvent: false });
    this.xecsForm.get('localidad')?.setValue(selected.town);
  }
}

displayFn(zip: any): string {
  return typeof zip === 'object' && zip ? zip.zipCode : zip;
}

private _filter(filterValue: string): ZipCodesIBDTO[] {
  
  return this.cpostals.filter((cpostal:any) =>
    cpostal.id.includes(filterValue)
  );
}

private getAllcpostals() {
  this.commonService.getZipCodes().subscribe((zpCodes: ZipCodesIBDTO[]) => {
      const zpCodesFiltered: ZipCodesIBDTO[] = zpCodes.filter((zpCode: ZipCodesIBDTO) => zpCode.deleted_at?.toString() === "0000-00-00 00:00:00")
       this.cpostals = zpCodesFiltered; 
      }, (error) => { this.showSnackBar(error) });
}

private getAllCnaes() {
  this.commonService.getCNAEs().subscribe((cnaes: CnaeDTO[]) => {
      const cnaesFiltered: CnaeDTO[] = cnaes.filter((cnae: CnaeDTO) => cnae.deleted_at?.toString() === "0000-00-00 00:00:00")
      this.cnaes = cnaesFiltered;
      this.cnaes = cnaes
      }, (error) => {  console.error("Error real:", error);
  this.showSnackBar(error + ' ' + error.message || 'Error'); });
}

private getAllXecsPrograms() {
  this.commonService.getXecsPrograms().subscribe((programs: XecsProgramsDTO[]) => {
    this.xecsPrograms = programs
  })
}

private getResponsabilityDeclarations() {
  this.commonService.getResponsabilityDeclarations().subscribe((responsibilityDeclarations: ResponsabilityDeclarationDTO[]) => {
    responsibilityDeclarations.map((item:ResponsabilityDeclarationDTO) => {
    if (localStorage.getItem('preferredLang') === 'ca-ES') {
      item.label = item.label_ca
    }
   })
    this.responsibilityDeclarations = responsibilityDeclarations
  })
}

private getDocumentationAndAuthorizations() {
  this.commonService.getDocumentationAndAuthorizations().subscribe((authorizations: AuthorizationTextDTO[]) => {
   authorizations.map((item:AuthorizationTextDTO) => {
    if (localStorage.getItem('preferredLang') === 'ca-ES') {
      item.label = item.label_ca
    }
   })
    this.authorizations = authorizations
  })
}

uploadTheFile(timestamp: string, files: File[] ): Observable<any> {
  if (!files || files.length === 0) {
    return of(null); // Devuelve observable vacío si no hay archivos
  }

  const formData = new FormData();
  const nif = this.xecsForm.value.nif;
  files.forEach(file => {
    formData.append('files[]', file);
  });
  console.log (files)

  return this.documentService.createDocument( nif, timestamp, formData).pipe(
    tap((event: HttpEvent<any>) => {
      switch (event.type) {
        case HttpEventType.Sent:
          this.showSnackBar('Archivos enviados al servidor...');
          break;
        case HttpEventType.UploadProgress:
          if (event.total) {
            this.uploadProgress = Math.round((100 * event.loaded) / event.total);
          }
          break;
        case HttpEventType.Response:
          this.showSnackBar('Archivos subidos con éxito: '+ event.body);
          this.uploadProgress = 100;
          break;
      }
    }),
    catchError(err => {
      this.showSnackBar('Error al subir los archivos: ' + err);
      return throwError(() => err);
    })
  );
}
  
private showSnackBar(error: string): void {
    this.snackBar.open(error, 'Close', {
      duration: 15000,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
      panelClass: ['custom-snackbar'],
    });
}
}