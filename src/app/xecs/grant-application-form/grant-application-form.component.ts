
import {ChangeDetectionStrategy, Component, viewChild, signal, inject, ViewEncapsulation} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
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
import { PopUpDialogComponent } from '../../popup-dialog/popup-dialog.component';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http'

@Component({
  selector: 'app-grant-application-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, 
    MatButtonModule, MatSelectModule, MatExpansionModule, 
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

constructor (private fb: FormBuilder, private http: HttpClient) {
this.ayudaForm = this.fb.group ({
    opc_programa: this.fb.array([], Validators.required),
    documentos: this.fb.control<File[] | null>(null),
    acceptRGPD: this.fb.control<boolean | null>(false, Validators.required),
    tipoSolicitante: this.fb.control<string | null>(null, Validators.required)
});

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

archivosSubidos: File[] = [];

onSubmit(): void {
  if (this.ayudaForm.valid) {
    const datos = this.ayudaForm.value;
    console.log (datos)
    console.log('Programas seleccionados:', datos.opc_programa);
    console.log('Archivos subidos:', datos.documentos);
  }
}

get nombresArchivos(): string {
  return this.archivosSubidos.map(f => f.name).join(', ');
}

onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    this.archivosSubidos = Array.from(input.files);
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
}

