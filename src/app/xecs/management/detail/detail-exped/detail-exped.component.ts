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
    MatCardModule,
  ]
})
export class DetailExpedComponent {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private expedienteService = inject(ExpedienteService);

  form!: FormGroup;
  idExpediente!: number;

  ngOnInit(): void {
    this.idExpediente = +this.route.snapshot.paramMap.get('id')!;

    this.form = this.fb.group({
      empresa: [{ value: '', disabled: true }],
      tipoTramite: [{ value: '', disabled: true }],
      importe: [{ value: null, disabled: true }],
      situacion: [{ value: '', disabled: true }],
    });

    this.expedienteService.getOneExpediente(this.idExpediente)
      .pipe(catchError(() => of(null)))
      .subscribe(expediente => {
        if (expediente) {
          this.form.patchValue({
            empresa: expediente.empresa,
            tipoTramite: expediente.tipo_tramite,
            importe: expediente.importe,
            situacion: expediente.situacion
          });
        }
      });
  }
}
