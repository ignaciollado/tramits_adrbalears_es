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

@Component({
  selector: 'app-detalle-expediente',
  standalone: true,
  templateUrl: './detail-exped.component.html',
  styleUrl: './detail-exped.component.scss',
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
      empresa: [{ value: '', disabled: true }],
      tipoTramite: [{ value: '', disabled: true }],
      importe: [{ value: null, disabled: true }],
      situacion: [{ value: '', disabled: true }],
    });

    this.getExpedDetail(this.idExpediente)
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
        this.form.patchValue({
          empresa: expediente.empresa,
          tipoTramite: expediente.tipo_tramite,
          importe: expediente.importe,
          situacion: expediente.situacion
        });
        this.showSnackBar('✅ Expediente cargado correctamente.');
      } else {
        this.showSnackBar('⚠️ No se encontró información del expediente.');
      }
    });
}

enableEdit(): void {
  this.form.enable();
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
