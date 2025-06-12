
import {ChangeDetectionStrategy, Component, viewChild, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule, MatAccordion } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';

@Component({
  selector: 'app-grant-application-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, 
    MatButtonModule, MatSelectModule, MatExpansionModule, 
    MatAccordion, MatIconModule, MatDatepickerModule, MatCheckboxModule, MatRadioModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
  templateUrl: './grant-application-form.component.html',
  styleUrl: './grant-application-form.component.scss'
})

export class GrantApplicationFormComponent {
step = signal(0);
ayudaForm: FormGroup  
accordion = viewChild.required(MatAccordion)
rgpdAccepted = false

constructor (private fb: FormBuilder) {
this.ayudaForm = this.fb.group({
  programa: this.fb.control<string[] | null>([], Validators.required),
  documentos: this.fb.control<File[] | null>(null, Validators.required),
  acceptRGPD: this.fb.control<boolean | null>(false, Validators.required)
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

/* onFileChange(event: Event) {
 const input = event.target as HTMLInputElement;
 if (input.files) {
  const files = Array.from(input.files);
  const validFiles = files.filter(file =>
 ['application/pdf', 'image/png', 'image/jpeg'].includes(file.type)
 );
 this.archivosSubidos = validFiles;
 this.ayudaForm.patchValue({ documentos: validFiles });
}
 } */

onSubmit(): void {
  if (this.ayudaForm.valid) {
    const datos = this.ayudaForm.value;
    console.log('Programas seleccionados:', datos.programa);
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


}

