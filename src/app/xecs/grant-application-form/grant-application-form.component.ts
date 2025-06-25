
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
import { jsPDF } from 'jspdf';
import { CnaeDTO } from '../../Models/cnae.dto';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { from } from 'rxjs';
import { catchError, concatMap, tap } from 'rxjs/operators';

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
  filteredZipCodes: Observable<ZipCodesIBDTO[]> | undefined;
  zipCodes: ZipCodesIBDTO[] = [];
  cnaes: CnaeDTO[] = [];

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

responsibilityDeclarations = [
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

file_memoriaTecnicaToUpload: File[] = []
file_certificadoIAEToUpload: File[] = []
file_nifEmpresaToUpload: File[] = []

onSubmit(): void {

    const datos = this.ayudaForm.value;
    const cControls = this.ayudaForm.controls
    console.log (datos)
    console.log('Programas seleccionados:', datos.opc_programa)

    const timeStamp = this.generateCustomTimestamp();
    const filesToUpload = [
      this.file_memoriaTecnicaToUpload,
      this.file_certificadoIAEToUpload,
      this.file_nifEmpresaToUpload
    ];
    from(filesToUpload)
  .pipe(
    concatMap(file => this.uploadTheFile(timeStamp, file))
  )
  .subscribe({
    next: (event) => {
      console.log ("event0", event)
      this.showSnackBar('Subido: '+ event.status);
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

generateCertificate(dataToRender: any): void {
  const doc = new jsPDF();
  
  // Texto del pie de página
  const footerText = 'Plaça de Son Castelló, 1\n07009 Polígon de Son Castelló - Palma\nTel. 971 17 61 61\nwww.adrbalears.es';

  // Establecer estilo si lo deseas
  doc.setFont('Arial', 'normal');
  doc.setFontSize(8);

  // Posición del pie de página
  const marginLeft = 25;
  const lineHeight = 4;
  const pageHeight = doc.internal.pageSize.getHeight();

  // Dividir el texto en líneas
  const lines = footerText.split('\n');

  // Dibujar cada línea desde abajo hacia arriba
  lines.reverse().forEach((line, index) => {
    const y = pageHeight - 10 - (index * lineHeight);
    doc.text(line, marginLeft, y);
  });

  // Añadir el texto centrado en la parte inferior
  //const textWidth = doc.getTextWidth(footerText);
  //const pageWidth = doc.internal.pageSize.getWidth();
  //const x = (pageWidth - textWidth) / 2;
  // const y = pageHeight - margin;
  //doc.text(footerText, x, y);

  const rawDate = dataToRender.eventDate; // puede ser string o Date
  const eventDate = new Date(rawDate);

  const TITULO_EVENTO = dataToRender.title
  const FECHA_EVENTO = `${eventDate.getDate().toString().padStart(2, '0')}/${(eventDate.getMonth() + 1).toString().padStart(2, '0')}/${eventDate.getFullYear()}`;
  const HORAS_EVENTO = dataToRender.timeDuration + " hrs"
 
  const date = new Date();
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = date.toLocaleDateString('ca-ES', options);

  doc.addImage("../../../../assets/images/ADRBalearscompleto-conselleria.jpg", "JPEG", 25, 20, 75, 15);
  doc.setFontSize(12);
  doc.text("Convocatoria para la concesión de ayudas de cheques de consultoría para impulsar a la industria de Baleares en materia de digitalización, internacionalización, sostenibilidad y gestión avanzada.,", 25, 65)

  doc.setFont('Arial', 'bold');
  doc.text("CERTIFIC:", 25, 100)
  doc.setFont('Arial', 'normal');

  doc.text(`Convocatoria 2025 ${dataToRender.firstName+' '+dataToRender.lastName} , amb DNI ${dataToRender.dni}, ha assistit a la càpsula\nformativa “${TITULO_EVENTO}”, organitzat per l'Agència de\nDesevolupament Regional de les Illes Balears (ADR). Dia ${FECHA_EVENTO},\namb una durada de ${HORAS_EVENTO}`, 25, 140)

  doc.text("I perquè consti als efectes oportuns firm aquest certificat.", 25, 180)

  doc.text(`Palma, ${formattedDate}`, 25, 220);

  doc.save(`certificado_${dataToRender.firstName+'_'+dataToRender.lastName}.pdf`);
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

generateCustomTimestamp(): string {
  const date = new Date();

  const pad = (n: number) => n.toString().padStart(2, '0');

  let hours = date.getHours();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;

  const timestamp = `${pad(date.getDate())}_${pad(date.getMonth() + 1)}_${date.getFullYear()}_${pad(hours)}_${pad(date.getMinutes())}_${pad(date.getSeconds())}${ampm}`;

  return timestamp;
}

}

