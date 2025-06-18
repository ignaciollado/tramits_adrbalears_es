
import { ChangeDetectionStrategy, Component, viewChild, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { map, Observable, startWith } from 'rxjs';
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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { PopUpDialogComponent } from '../../popup-dialog/popup-dialog.component';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { ZipCodesIBDTO } from '../../Models/zip-codes-ib.dto';
import { CommonService } from '../../Services/common.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppComponent } from '../../app.component';

@Component({
  selector: 'app-grant-application-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatSelectModule, MatExpansionModule, MatAutocompleteModule, AppComponent,
    MatAccordion, MatIconModule, MatDatepickerModule, MatCheckboxModule, MatRadioModule, MatDialogModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
  templateUrl: './grant-application-form.component.html',
  styleUrl: './grant-application-form.component.scss',
})

export class GrantApplicationFormComponent {
  readonly dialog = inject(MatDialog)
  htmlContent: string = ''
  step = signal(0)
  ayudaForm: FormGroup  
  accordion = viewChild.required(MatAccordion)
  rgpdAccepted = false
  introText: string = "getting intro text..."
  filteredZipCodes: Observable<ZipCodesIBDTO[]> | undefined;
  zipCodes: ZipCodesIBDTO[] = [];

  constructor (private fb: FormBuilder, private http: HttpClient, private commonService: CommonService,     private snackBar: MatSnackBar,) {
  this.ayudaForm = this.fb.group ({
    opc_programa: this.fb.array([], Validators.required),
    nif: this.fb.control('',[ Validators.required, Validators.pattern('^[0-9]+[A-Za-z]$')]),
    denom_interesado: this.fb.control('', Validators.required),
    domicilio: this.fb.control({value: '', disabled: false}, Validators.required),
    zipCode: this.fb.control ('', [Validators.required, Validators.pattern('^[0-9]*$')]),
    town: this.fb.control({value: '', disabled: true}, Validators.required),
    telefono_cont: this.fb.control('', [Validators.pattern('^[0-9]*$')]),
    documentos: this.fb.control<File[] | null>(null),
    acceptRGPD: this.fb.control<boolean | null>(false, Validators.required),
    tipoSolicitante: this.fb.control<string | null>(null, Validators.required),
    nom_representante:  this.fb.control<string | null>(''),
    nif_representante: this.fb.control<string | null>('', [Validators.required, Validators.pattern('^[0-9]+[A-Za-z]$')]),
    tel_representante: this.fb.control<string | null>('', [Validators.required, Validators.pattern('^[0-9]*$')]),
    mail_representante: this.fb.control<string | null>('', [Validators.required, Validators.email]),
    empresa_consultor: this.fb.control<string | null>(''),
    nom_consultor: this.fb.control<string | null>(''),
    tel_consultor: this.fb.control<string | null>('', Validators.pattern('^[0-9]*$')),
    mail_consultor: this.fb.control<string | null>('', Validators.email),
    file_memoriaTecnica: this.fb.control<string | null>('', Validators.required),
    file_certificadoIAE: this.fb.control<string | null>('', Validators.required),
    file_nifEmpresa: this.fb.control<string | null>('', Validators.required)

  });
this.getAllZipCodes()
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
    
 this.filteredZipCodes = this.ayudaForm.get('zipCode')?.valueChanges.pipe(
      startWith(''),
      map((value) => {
        const name = typeof value === 'string' ? value : value;
        return name ? this._filter(name as string) : this.zipCodes.slice();
      })
    ); 
}

setStep(index: number) {
  this.step.set(index);
}

programas = [
 "«IDigital», estratègia per impulsar la digitalització en la indústria de les Illes Balears.",
 "«IExporta», estratègia per impulsar la internacionalització de les empreses industrials de les Illes Balears.",
 "«ISostenibilitat», Identificació i càlcul de les emissions de gasos amb efecte d'hivernacle de l'organització.",
 "«ISostenibilitat», Identificació i càlcul de les emissions de gasos d'efecte d'hivernacle de producte.",
 "«IGestió», estratègia per impulsar la implantació d'eines de gestió avançada i optimització de processos de la indústria de les Illes Balears."
];

authorizations = [
  "Document identificatiu de la persona sol·licitant o persona autoritzada per l’empresa en representació de la mateixa.",
  "Certificat de l'Agència Tributària de les Illes Balears (ATIB) d'estar al corrent de les obligacions tributàries amb la comunitat autònoma de les Illes Balears.",
  "Certificat de la Tesorería General de la Seguridad Social (TGSS) d'estar al corrent de pagament de les seves obligacions."
]

responsibleDeclarations = [
  "I) Que complesc el reglament (UE) núm.1407/2013 de la Comissió de 18 de desembre de 2013, relatiu a l’aplicació dels articles 107 i 108 del Tractat de Funcionament de la Unió Europea de les ajudes de minimis i el reglament (UE) 2023/2831 de la comissió, de 13 de desembre de 2023, relatiu a l’aplicació dels articles 107 i 108 del Tractat.",
  "II) Que durant els exercicis fiscals 2022, 2023 i 2024 he rebut un import total d’ajuts de minimis de:",
  "III) Que no he rebut ajuts o subvencions d’altres administracions públiques, o d’altres ens públics o privats, nacionals o internacionals que, aïlladament o en concurrència, superi el 100 % del cost de l’activitat que hagi de desenvolupar l’empresa beneficiària.",
  "IV) Que dispòs de la capacitat de representació suficient, degudament acreditada, per dur a terme la tramitació indicada.",
  "V) Que no em trob en cap de les circumstàncies especificades a l’article 10 del Decret legislatiu 2/2005, de 28 de desembre, pel qual s’aprova el Text refós de la Llei de subvencions, que s’ha d’incloure en la sol·licitud.",
  "VI) Que l’entitat beneficiària està inscrita en el Registre Industrial o en el Registre Miner de les Illes Balears, si escau.",
  "VII) Que complesc amb les exigències establertes per la normativa en matèria de seguretat industrial i minera, i qualsevol altra que hi sigui aplicable; en el cas de les empreses industrials s’ha d’incloure en la sol·licitud. ",
  "VIII) Que les dades consignades en aquest document són certes, que complesc amb tots els requisits exigits en la convocatòria, i que presento adjunta la documentació corresponent, d’acord amb la resolució de la convocatòria.",
  "IX) Que el consultor compleix amb el punts 7.2 i 7.3 de la convocatòria.",
  "X)  Que he iniciat, en un temps superior a dos anys, una activitat econòmica en el territori de les Illes Balears, amb domicili a les Illes Balears, i que no supero els paràmetres de la condició de pime.",
  "XI) Que no tinc la consideració d’empresa en crisi d’acord amb l’article 2.18 del Reglament ( UE) 651/2014 de la comissió de dia 17 de juny de 2014."
]

file_memoriaTecnicaUploaded: File[] = []
file_certificadoIAEUploaded: File[] = []
file_nifEmpresaUploaded: File[] = []

onSubmit(): void {
  if (this.ayudaForm.valid) {
    const datos = this.ayudaForm.value;
    console.log (datos)
    console.log('Programas seleccionados:', datos.opc_programa);
    console.log('Archivos subidos:', datos.documentos);
  }
}

get memoriaTecnicaFileNames(): string {
  return this.file_memoriaTecnicaUploaded.map(f => f.name).join(', ')
}
onFileMemoriaTecnicaChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    this.file_memoriaTecnicaUploaded = Array.from(input.files);
    console.log ("this.file_memoriaTecnicaUploaded", this.file_memoriaTecnicaUploaded)
  }
}

get certificadoIAEFileNames(): string {
  return this.file_certificadoIAEUploaded.map(f => f.name).join(', ')
}
onFileCertificadoIAEChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    this.file_certificadoIAEUploaded = Array.from(input.files);
    console.log ("this.file_certificadoIAEUploaded", this.file_certificadoIAEUploaded)
  }
}

get nifEmpresaFileNames(): string {
  return this.file_nifEmpresaUploaded.map(f => f.name).join(', ')
}
onFileNifEmpresaChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    this.file_nifEmpresaUploaded = Array.from(input.files);
    console.log ("this.file_nifEmpresaUploaded", this.file_nifEmpresaUploaded)
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

selecteZipValue() {
    const zipCodeForm = this.ayudaForm.get('zipCode')?.value
    if (zipCodeForm) {
      this.ayudaForm.get('town')?.setValue(zipCodeForm['town'])
    }
}

displayFn(zpCode: ZipCodesIBDTO): string {
  return zpCode && zpCode.zipCode ? zpCode.zipCode : '';
}

private _filter(name: string): ZipCodesIBDTO[] {
  const filterValue = name;
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
    
private showSnackBar(error: string): void {
    this.snackBar.open(error, 'Close', {
      duration: 10000,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
      panelClass: ['custom-snackbar'],
    });
}
}

