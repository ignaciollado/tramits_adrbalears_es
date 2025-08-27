import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PindustLineaAyudaService } from '../../../../../Services/linea-ayuda.service';
import { PindustLineaAyudaDTO } from '../../../../../Models/linea-ayuda-dto';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-linea-ayuda-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],

  templateUrl: './configuration-line-detail.component.html',
  styleUrls: ['./configuration-line-detail.component.scss']
})

export class ConfigurationLineDetailComponent implements OnInit {
  form!: FormGroup;
  isNew = false;
  id!: number;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private service: PindustLineaAyudaService
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.isNew = isNaN(this.id);

    // Inicializar el formulario con controles y validaciones
    this.form = this.fb.group({
      codigoSIA: ['', Validators.required],
      convocatoria: [null, [Validators.required, Validators.min(0)]],
      num_BOIB: ['', Validators.required],
      fecha_BOIB: ['', Validators.required],
      num_BOIB_modific: [''],
      fechaResPresidIDI: [''],
      lineaAyuda: ['', Validators.required],
      programa: ['', Validators.required],
      convocatoria_desde: ['', Validators.required],
      convocatoria_hasta: ['', Validators.required],
      dias_fecha_lim_justificar: [null, [Validators.required, Validators.min(0)]],
      meses_fecha_lim_consultoria: ['', Validators.required],
      updateInterval: [null, [Validators.required, Validators.min(0)]],
      convocatoria_aviso_ca: ['', Validators.required],
      convocatoria_aviso_es: ['', Validators.required],
      activeLineData: ['', Validators.required],
      totalAmount: [null, [Validators.required, Validators.min(0)]]
    });

    if (!this.isNew) {
      this.service.getById(this.id).subscribe({
        next: data => this.form.patchValue(this.formatDatesForForm(data)),
        error: err => {
          alert('Error al cargar la línea ayuda');
          console.error(err);
        }
      });
    }
  }

  formatDatesForForm(data: PindustLineaAyudaDTO): PindustLineaAyudaDTO {
    // Formatear fechas a yyyy-MM-dd para inputs tipo date
    const formatted = { ...data };
    (['fecha_BOIB', 'fechaResPresidIDI', 'convocatoria_desde', 'convocatoria_hasta'] as (keyof PindustLineaAyudaDTO)[]).forEach(field => {
      if (formatted[field]) {
        // @ts-expect-error: We know these fields are strings or undefined
        formatted[field] = (formatted[field] as string).substring(0, 10);
      }
    });
    return formatted;
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const payload: PindustLineaAyudaDTO = this.form.value;

    if (this.isNew) {
      this.service.create(payload).subscribe({
        next: () => this.volver(),
        error: err => {
          alert('Error al crear la línea ayuda');
          console.error(err);
        }
      });
    } else {
      this.service.update(this.id, payload).subscribe({
        next: () => this.volver(),
        error: err => {
          alert('Error al actualizar la línea ayuda');
          console.error(err);
        }
      });
    }
  }

  onDelete(): void {
    if (this.isNew) return;
    if (confirm('¿Estás seguro de eliminar esta línea ayuda?')) {
      this.service.delete(this.id).subscribe({
        next: () => this.volver(),
        error: err => {
          alert('Error al eliminar la línea ayuda');
          console.error(err);
        }
      });
    }
  }

  volver(): void {
    this.router.navigate(['/linea-ayuda']);
  }
}
