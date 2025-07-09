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
import { catchError, concatMap, tap } from 'rxjs/operators';
import { XecsProgramsDTO } from '../../Models/xecs-programs-dto';
import { AuthorizationTextDTO } from '../../Models/authorization-texts-dto';
import { ResponsabilityDeclarationDTO } from '../../Models/responsability-declaration-dto';
import { ExpedienteService } from '../../Services/expediente.service';

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
  filteredZipCodes: Observable<ZipCodesIBDTO[]> | undefined
  zipCodes: ZipCodesIBDTO[] = []
  cnaes: CnaeDTO[] = []
  xecsPrograms: XecsProgramsDTO[] = []
  responsibilityDeclarations: ResponsabilityDeclarationDTO[] = []
  authorizations: AuthorizationTextDTO[] = []
  filesToUploadOptional: string[] = []  // new

  constructor ( private fb: FormBuilder, 
    private http: HttpClient, 
    private commonService: CommonService, 
    private sanitizer: DomSanitizer,
    private expedienteService: ExpedienteService,
    private documentServive: DocumentService,
    private nifValidator: NifValidatorService, 
    private snackBar: MatSnackBar ) {

  this.xecsForm = this.fb.group ({
    opc_programa: this.fb.array([], Validators.required),
    nif: this.fb.control({value:'', disabled: true}, [Validators.required]),
    denom_interesado: this.fb.control('', ),
    domicilio: this.fb.control({value: '', disabled: false}, ),
    zipCode: this.fb.control ('', [ Validators.pattern('^07[0-9]{3}$')]),
    town: this.fb.control({value: '', disabled: true}, ),
    codigoIAE: this.fb.control({value: '', disabled: false}, ),
    telefono_cont: this.fb.control('', [Validators.pattern('^[0-9]{9}$')]),
    acceptRGPD: this.fb.control<boolean | null>(false, Validators.required),
    tipo_tramite: this.fb.control<string[] | null>(null, Validators.required),
    tipo_solicitante: this.fb.control<string | null>(null, Validators.required),
    nom_representante:  this.fb.control<string | null>({value: '', disabled: true}),
    nif_representante: this.fb.control<string | null>({value: '', disabled: true}, [Validators.pattern('^[0-9]+[A-Za-z]$')]),
    tel_representante: this.fb.control<string | null>('', [Validators.pattern('^[0-9]{9}$')]),
    mail_representante: this.fb.control<string | null>('', [Validators.email]),
    empresa_consultor: this.fb.control<string | null>(''),
    nom_consultor: this.fb.control<string | null>(''),
    tel_consultor: this.fb.control<string | null>('', Validators.pattern('^[0-9]{9}$')),
    mail_consultor: this.fb.control<string | null>('', Validators.email),

    memoriaTecnicaEnIDI: this.fb.control<boolean | null>(false, Validators.required),
    file_memoriaTecnica: this.fb.control<File | null>(null, Validators.required),
    file_certificadoIAE: this.fb.control<File | null>(null, Validators.required),
    copiaNIFSociedadEnIDI:this.fb.control<boolean | null>(false, Validators.required),
    file_nifEmpresa: this.fb.control<File | null>(null, Validators.required),
    pJuridicaDocAcreditativaEnIDI: this.fb.control<boolean | null>(false, Validators.required),
    file_escritura_empresa: this.fb.control<File | null>(null, Validators.required),

    file_document_acred_como_repres: this.fb.control<File | null>(null, Validators.required),
    file_certificadoAEAT: this.fb.control<File | null>(null, Validators.required),
    consentimientocopiaNIF: this.fb.control<boolean | null>(true, Validators.required),
    file_copiaNIF: this.fb.control<File | null>(null),
    consentimiento_certificadoATIB: this.fb.control<boolean | null>(true, Validators.required),
    file_certificadoATIB: this.fb.control<File | null>(null),
    consentimiento_certificadoSegSoc: this.fb.control<boolean | null>(true, Validators.required),
    file_certificadoSegSoc: this.fb.control<File | null>(null),

    nom_entidad: this.fb.control<string | null>('', ),
    domicilio_sucursal: this.fb.control<string | null>('', ),
    codigo_BIC_SWIFT: this.fb.control<string | null>('', [ Validators.minLength(11), Validators.maxLength(11), Validators.pattern(/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/)]),
    opcion_banco: this.fb.control<string | null>('', ),
    cc: this.fb.control<string | null>({value: '', disabled: true}, [ Validators.minLength(25), Validators.maxLength(25), Validators.pattern(/^\S*$/)]),

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

this.getAllZipCodes()
this.getAllCnaes()
this.getAllXecsPrograms()
this.getResponsabilityDeclarations()
this.getDocumentationAndAuthorizations()
}

ngOnInit(): void {

 this.xecsForm.get('acceptRGPD')?.valueChanges.subscribe((value: boolean) => {
 this.rgpdAccepted = value;
 });
    
this.filteredZipCodes = this.xecsForm.get('zipCode')!.valueChanges.pipe(
  startWith(''),
  map(value => {
    const input = typeof value === 'string' ? value : value?.zipCode || '';
    return input ? this._filter(input) : this.zipCodes.slice();
  })
);

const nifControl = this.xecsForm.get('nif')
const nom_representanteControl = this.xecsForm.get('nom_representante')
const nif_representanteControl = this.xecsForm.get('nif_representante')
const opcionBancoControl = this.xecsForm.get('opcion_banco')
const ccControl = this.xecsForm.get('cc')
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
/*  const nifControl = this.xecsForm.get('nif'); */
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


file_memoriaTecnicaToUpload: File[] = []
file_certificadoIAEToUpload: File[] = []
file_nifEmpresaToUpload: File[] = []
file_escritura_empresaToUpload: File[] = [] // new
file_document_acred_como_represToUpload: File[] = [] // new
file_certificadoAEATToUpload: File[] = [] // new

file_copiaNIFToUpload: File[] = [] // optional
file_certificadoATIBToUpload: File[] = [] // optional
file_certificadoSegSocToUpload: File[] = [] // optional

onSubmit(): void {
    const datos = this.xecsForm.value;
    const cControls = this.xecsForm.controls
    console.log (datos)

    const timeStamp = this.commonService.generateCustomTimestamp();
    const filesToUpload = [ 
      this.file_memoriaTecnicaToUpload, this.file_certificadoIAEToUpload, this.file_nifEmpresaToUpload, 
      this.file_escritura_empresaToUpload, this.file_document_acred_como_represToUpload, this.file_certificadoAEATToUpload ]

    from(filesToUpload)
    .pipe(
      concatMap(file => this.uploadTheFile(timeStamp, file))
    )
    .subscribe({
      next: (event) => {
        console.log ("event0", event)
      },
      complete: () => {
        this.showSnackBar('Todas las subidas finalizadas');
      },
      error: (err) => {
        this.showSnackBar('Error durante la secuencia de subida: '+ err);
      }
    });

}

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


selectedZipValue(event: MatAutocompleteSelectedEvent): void {
  const selected = event.option.value;
  if (selected && selected.zipCode) {
    this.xecsForm.get('zipCode')?.setValue(selected.zipCode, { emitEvent: false });
    this.xecsForm.get('town')?.setValue(selected.town);
  }
}

displayFn(zip: any): string {
  return typeof zip === 'object' && zip ? zip.zipCode : zip;
}

private _filter(filterValue: string): ZipCodesIBDTO[] {
  
  return this.zipCodes.filter((zipCode:any) =>
    zipCode.zipCode.includes(filterValue)
  );
}

private getAllZipCodes() {
  this.commonService.getZipCodes().subscribe((zpCodes: ZipCodesIBDTO[]) => {
      const zpCodesFiltered: ZipCodesIBDTO[] = zpCodes.filter((zpCode: ZipCodesIBDTO) => zpCode.deleted_at?.toString() === "0000-00-00 00:00:00")
       this.zipCodes = zpCodesFiltered; 
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

uploadTheFile(timestamp: string, files: File[]): Observable<any> {
  if (!files || files.length === 0) {
    return of(null); // Devuelve observable vacío si no hay archivos
  }

  const formData = new FormData();
  const nif = this.xecsForm.value.nif;

  files.forEach(file => {
    formData.append('files[]', file);
  });

  return this.documentServive.createDocument(nif, timestamp, formData).pipe(
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
      duration: 10000,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
      panelClass: ['custom-snackbar'],
    });
}


}

