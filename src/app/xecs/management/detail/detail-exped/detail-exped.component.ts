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

@Component({
  selector: 'app-detalle-expediente',
  standalone: true,
  templateUrl: './detail-exped.component.html',
  styleUrl: './detail-exped.component.scss',
  imports: [
    CommonModule,
    ReactiveFormsModule, MatButtonModule, MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule, MatSnackBarModule,
  ]
})
export class DetailExpedComponent {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private expedienteService = inject(ExpedienteService);

  form!: FormGroup;
  idExpediente!: number;

  constructor(private snackBar: MatSnackBar) {}

ngOnInit(): void {
  this.idExpediente = +this.route.snapshot.paramMap.get('id')!;

  this.form = this.fb.group({
    id: [{ value: '', disabled: true }],
    empresa: [{ value: '', disabled: true }],
    tipo_tramite: [{ value: '', disabled: true }],
    nif: [{ value: '', disabled: true }],
    domicilio: [{ value: '', disabled: true }],
    localidad: [{ value: '', disabled: true }],
    telefono: [{ value: '', disabled: true }],
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
        console.error('Error al obtener el expediente:', error);
        this.showSnackBar('❌ Error al cargar el expediente. Inténtalo de nuevo más tarde.');
        return of(null);
      })
    )
    .subscribe(expediente => {
      if (expediente) {
        this.form.patchValue(expediente);
        this.showSnackBar('✅ Expediente cargado correctamente.');
      } else {
        this.showSnackBar('⚠️ No se encontró información del expediente.');
      }
    });
}

enableEdit(): void {
  Object.keys(this.form.controls).forEach(controlName => {
    if (controlName !== 'id') {
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
      next: () => this.showSnackBar('✅ Expediente guardado correctamente.'),
      error: () => this.showSnackBar('❌ Error al guardar el expediente.')
    });
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
