import { ChangeDetectionStrategy, Component, viewChild, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
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
  htmlContent: string = ''
  step = signal(0)
  uploadProgress: number = 0
  ayudaForm: FormGroup  
  accordion = viewChild.required(MatAccordion)
  rgpdAccepted = false
  introText: string = "getting intro text..."
  filteredZipCodes: Observable<ZipCodesIBDTO[]> | undefined
  zipCodes: ZipCodesIBDTO[] = []
  cnaes: CnaeDTO[] = []
  xecsPrograms: XecsProgramsDTO[] = []
  responsibilityDeclarations: string[] = []
  authorizations: AuthorizationTextDTO[] = []

  constructor ( private fb: FormBuilder, 
    private http: HttpClient, 
    private commonService: CommonService, 
    private documentServive: DocumentService,
    private nifValidator: NifValidatorService, 
    private snackBar: MatSnackBar ) {

  this.ayudaForm = this.fb.group ({
    opc_programa: this.fb.array([], Validators.required),
    nif: this.fb.control('', [Validators.required, Validators.minLength(9), Validators.maxLength(9), this.nifValidator.validateNifOrCif()]),
    denom_interesado: this.fb.control('', ),
    domicilio: this.fb.control({value: '', disabled: false}, ),
    zipCode: this.fb.control ('', [ Validators.pattern('^07[0-9]{3}$')]),
    town: this.fb.control({value: '', disabled: true}, ),
    codigoIAE: this.fb.control({value: '', disabled: false}, ),
    telefono_cont: this.fb.control('', [Validators.pattern('^[0-9]{9}$')]),
  
    acceptRGPD: this.fb.control<boolean | null>(false, Validators.required),
    tipoSolicitante: this.fb.control<string | null>(null, Validators.required),
    nom_representante:  this.fb.control<string | null>(''),
    nif_representante: this.fb.control<string | null>('', [Validators.pattern('^[0-9]+[A-Za-z]$')]),
    tel_representante: this.fb.control<string | null>('', [Validators.pattern('^[0-9]{9}$')]),
    mail_representante: this.fb.control<string | null>('', [Validators.email]),
    empresa_consultor: this.fb.control<string | null>(''),
    nom_consultor: this.fb.control<string | null>(''),
    tel_consultor: this.fb.control<string | null>('', Validators.pattern('^[0-9]{9}$')),
    mail_consultor: this.fb.control<string | null>('', Validators.email),
    file_memoriaTecnica: this.fb.control<string | null>('', Validators.required),
    file_certificadoIAE: this.fb.control<string | null>('', Validators.required),
    file_nifEmpresa: this.fb.control<string | null>('', Validators.required),


    nom_entidad: this.fb.control<string | null>('', ),
    domicilio_sucursal: this.fb.control<string | null>('', ),
    codigo_BIC_SWIFT: this.fb.control<string | null>('', [ Validators.minLength(11), Validators.maxLength(11), Validators.pattern(/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/)]),
    opcion_banco: this.fb.control<string | null>('', ),
    cc: this.fb.control<string | null>({value: '', disabled: true}, [ Validators.minLength(25), Validators.maxLength(25), Validators.pattern(/^\S*$/)]),

    consentimientocopiaNIF: this.fb.control<string | null>('true', Validators.required),
    consentimiento_certificadoATIB: this.fb.control<string | null>('true', Validators.required),
    consentimiento_certificadoSegSoc: this.fb.control<string | null>('true', Validators.required),

    declaracion_responsable_i: this.fb.control<string | null>({ value: 'true', disabled: true }),
    declaracion_responsable_ii: this.fb.control<string | null>(''),
    declaracion_responsable_iv: this.fb.control<string | null>({ value: 'true', disabled: true }),
    declaracion_responsable_v: this.fb.control<string | null>({ value: 'true', disabled: true }),
    declaracion_responsable_vi: this.fb.control<string | null>({ value: 'true', disabled: true }),
    declaracion_responsable_vii: this.fb.control<string | null>({ value: 'true', disabled: true }),
    declaracion_responsable_viii: this.fb.control<string | null>({ value: 'true', disabled: true }),
    declaracion_responsable_ix: this.fb.control<string | null>({ value: 'true', disabled: true }),
    declaracion_responsable_x: this.fb.control<string | null>({ value: 'true', disabled: true }),
    declaracion_responsable_xi: this.fb.control<string | null>({ value: 'true', disabled: true }),
  });

this.getAllZipCodes()
this.getAllCnaes()
this.getAllXecsPrograms()
this.getResponsabilityDeclarations()
this.getDocumentationAndAuthorizations()

this.http.get('../../../assets/data/documentacionRequerida.html', { responseType: 'text' })
 .subscribe({
    next: (html) => this.htmlContent = html,
    error: () => this.htmlContent = '<p>Error al cargar el contenido.</p>'
 });
}

ngOnInit(): void {
 this.ayudaForm.get('acceptRGPD')?.valueChanges.subscribe((value: boolean) => {
 this.rgpdAccepted = value;
 });
    
this.filteredZipCodes = this.ayudaForm.get('zipCode')!.valueChanges.pipe(
  startWith(''),
  map(value => {
    const input = typeof value === 'string' ? value : value?.zipCode || '';
    return input ? this._filter(input) : this.zipCodes.slice();
  })
);

const nifControl = this.ayudaForm.get('nif');
const opcionBancoControl = this.ayudaForm.get('opcion_banco');
const ccControl = this.ayudaForm.get('cc');
const codigo_BIC_SWIFTControl = this.ayudaForm.get('codigo_BIC_SWIFT')

opcionBancoControl?.valueChanges.subscribe((valor) => {
 
 ccControl?.enable()

 if (valor === '1') {
 // Patrón para IBAN español (por ejemplo: empieza por ES y 22 dígitos)
  ccControl?.setValidators([
  Validators.required,
  Validators.minLength(25),
  Validators.maxLength(25),
  Validators.pattern(/^ES\d{23}$/)
 ]);
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

ccControl?.valueChanges.subscribe((valor) => {
 if (opcionBancoControl?.value === '1' && valor !== valor?.toUpperCase()) {
    ccControl.setValue(valor.toUpperCase(), { emitEvent: false });
 }
});

codigo_BIC_SWIFTControl?.valueChanges.subscribe((valor) => {
  codigo_BIC_SWIFTControl.setValue(valor.toUpperCase(), { emitEvent: false });
});

}

setStep(index: number) {
  this.step.set(index);
}

file_memoriaTecnicaToUpload: File[] = []
file_certificadoIAEToUpload: File[] = []
file_nifEmpresaToUpload: File[] = []
file_copiaNIFToUpload: File[] = []
file_certificadoATIBToUpload: File[] = []
file_certificadoSegSocToUpload: File[] = []

onSubmit(): void {
    const datos = this.ayudaForm.value;
    const cControls = this.ayudaForm.controls
    console.log (datos)

    const timeStamp = this.commonService.generateCustomTimestamp();
    const filesToUpload = [ this.file_memoriaTecnicaToUpload, this.file_certificadoIAEToUpload, this.file_nifEmpresaToUpload ]

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
  console.log ("oncheckbosChange", event)
  const formArray: FormArray = this.ayudaForm.get('opc_programa') as FormArray;
  if (event.checked) {
    formArray.push(new FormControl(event.source.value));
  } else {
    const index = formArray.controls.findIndex(ctrl => ctrl.value === event.source.value);
    if (index >= 0) {
      formArray.removeAt(index);
    }
  }
}

selectedZipValue(event: MatAutocompleteSelectedEvent): void {
  const selected = event.option.value;
  if (selected && selected.zipCode) {
    this.ayudaForm.get('zipCode')?.setValue(selected.zipCode, { emitEvent: false });
    this.ayudaForm.get('town')?.setValue(selected.town);
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
  this.commonService.getResponsabilityDeclarations().subscribe((responsibilityDeclarations: string[]) => {
    this.responsibilityDeclarations = responsibilityDeclarations
  })
}

private getDocumentationAndAuthorizations() {
  this.commonService.getDocumentationAndAuthorizations().subscribe((authorizations: AuthorizationTextDTO[]) => {
    this.authorizations = authorizations
  })
}

uploadTheFile(timestamp: string, files: File[]): Observable<any> {
  if (!files || files.length === 0) {
    return of(null); // Devuelve observable vacío si no hay archivos
  }

  const formData = new FormData();
  const nif = this.ayudaForm.value.nif;

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

