import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PindustLineaAyudaService } from '../../../../../Services/linea-ayuda.service';
import { PindustLineaAyudaDTO } from '../../../../../Models/linea-ayuda-dto';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { ConfirmDialogComponent } from '../../../../../confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-linea-ayuda-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule, MatCard,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule, MatSelectModule,
    MatButtonModule
  ],

  templateUrl: './configuration-line-detail.component.html',
  styleUrls: ['./configuration-line-detail.component.scss']
})

export class ConfigurationLineDetailComponent implements OnInit {
  form!: FormGroup;
  isNew = false;
  id!: number;
  lineaAyudaOpciones: string[] = ['XECS', 'ILS', 'ADR-ISBA', 'FELIB'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router, private dialog: MatDialog, private snackBar: MatSnackBar,
    private service: PindustLineaAyudaService
  ) {}

  ngOnInit(): void {
  this.id = Number(this.route.snapshot.paramMap.get('id'));
  this.isNew = isNaN(this.id);

  const currentYear = new Date().getFullYear();

  this.form = this.fb.group({
    codigoSIA: ['', Validators.required],
    convocatoria: [currentYear, [Validators.required, Validators.min(0)]],
    num_BOIB: ['', Validators.required],
    fecha_BOIB: ['', Validators.required],
    num_BOIB_modific: [''],
    activeLineData: [{ value: 'SI', disabled: true }, Validators.required],
    fechaResPresidIDI: ['', Validators.required],
    lineaAyuda: ['', Validators.required],
    programa: ['{"Programa_I":{"edicion":{"Primera":[5100,90,60],"Segunda":[3825,80,45],"Tercera":[3825,80,45]}},   "Programa_II":{"edicion":{"Primera":[3825,90,45],"Segunda":[3825,80,45]}},   "Programa_III_ac":{"edicion":{"Primera":[2500,90,16],"Segunda":[2500,90,16],"Tercera":[2500,90,16]}},   "Programa_III_ap":{"edicion":{"Primera":[5500,90,45], "Segunda":[5500,90,45]}},   "Programa_IV":{"edicion":{"Primera":[5100,90,45], "Segunda":[3825,80,45]}}}', Validators.required],
    convocatoria_desde: ['', Validators.required],
    convocatoria_hasta: ['', Validators.required],
    dias_fecha_lim_justificar: [{ value: 20, disabled: false }, [Validators.min(0)]],
    meses_fecha_lim_consultoria: [{ value: "{'programa':'Programa I','intervalo':'5'}#{'programa':'Programa II','intervalo':'5'}#{'programa':'Programa III','intervalo':'3'}#{'programa':'Programa III actuacions corporatives','intervalo':'3'}#{'programa':'Programa III actuacions producte','intervalo':'3'}#{'programa':'Programa IV','intervalo':'5'}", disabled: true }],
    updateInterval: [{ value: 60, disabled: true }, [Validators.min(0)]],
    convocatoria_aviso_ca: [
      'Aquesta convocatòria encara no ha estat publicada en el BOIB. La data de presentació de les sol·licituds està pendent de determinar. Disculpin les molèsties',
      Validators.required
    ],
    convocatoria_aviso_es: [
      'Esta convocatoria todavía no está publicada en el BOIB. La fecha de presentación de las solicitudes está pendiente de determinar. Disculpen las molestias',
      Validators.required
    ],
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
  console.log(this.form.getRawValue());
  if (this.form.invalid) return;

  const payload: PindustLineaAyudaDTO = this.form.getRawValue();

  if (this.isNew) {
    this.service.create(payload).subscribe({
      next: () => this.volver(),
      error: err => {
        console.log(err.error.messages, err.error.messages.error);
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          width: '800px',
          data: {
            title: 'Error al crear la convocatoria',
            message: `Detalle del error "${err.error.messages.error}"?`
          }
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result === true) {
            this.snackBar.open('Mejora eliminada', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  } else {
    this.service.update(this.id, payload).subscribe({
      next: () => this.volver(),
      error: err => {
        alert('Error al actualizar la línea ayuda');
        console.log(err);
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
    this.router.navigate(['/line-configuration-list']);
  }
}
