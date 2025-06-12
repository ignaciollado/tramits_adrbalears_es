
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';

interface SolicitudAyudaForm {
  programa: string | null;
  documentos: File[] | null;
}


@Component({
  selector: 'app-grant-application-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './grant-application-form.component.html',
  styleUrl: './grant-application-form.component.scss'
})
export class GrantApplicationFormComponent {

ayudaForm = this.fb.group({
  programa: this.fb.control<string[] | null>([], Validators.required),
  documentos: this.fb.control<File[] | null>(null, Validators.required)
});



programas = [
 "«IDigital», estratègia per impulsar la digitalització en la indústria de les Illes Balears.",
 "«IExporta», estratègia per impulsar la internacionalització de les empreses industrials de les Illes Balears.",
 "«ISostenibilitat», Identificació i càlcul de les emissions de gasos amb efecte d'hivernacle de l'organització.",
 "«ISostenibilitat», Identificació i càlcul de les emissions de gasos d'efecte d'hivernacle de producte.",
 "«IGestió», estratègia per impulsar la implantació d'eines de gestió avançada i optimització de processos de la indústria de les Illes Balears."
];

archivosSubidos: File[] = [];

constructor(private fb: FormBuilder) {}

onFileChange(event: Event) {
 const input = event.target as HTMLInputElement;
 if (input.files) {
  const files = Array.from(input.files);
  const validFiles = files.filter(file =>
 ['application/pdf', 'image/png', 'image/jpeg'].includes(file.type)
 );
 this.archivosSubidos = validFiles;
 this.ayudaForm.patchValue({ documentos: validFiles });
}
 }

onSubmit(): void {
  if (this.ayudaForm.valid) {
    const datos = this.ayudaForm.value;
    console.log('Programas seleccionados:', datos.programa);
    console.log('Archivos subidos:', datos.documentos);
  }
}


}

