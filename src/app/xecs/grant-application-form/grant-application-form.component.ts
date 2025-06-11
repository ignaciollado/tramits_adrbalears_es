
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
  programa: this.fb.control<string | null>(null, Validators.required),
  documentos: this.fb.control<File[] | null>(null, Validators.required)
});


programas = [
 'Programa 1: Innovación Tecnológica',
 'Programa 2: Sostenibilidad Agraria',
 'Programa 3: Desarrollo Rural',
 'Programa 4: Apoyo a Jóvenes Agricultores'
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
    const datos: any = this.ayudaForm.value;
    console.log('Datos enviados:', datos);
  }
}

}

