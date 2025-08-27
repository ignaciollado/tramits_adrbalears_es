import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ConfigurationModelDTO } from '../../../../../Models/configuration.dto';
import { PindustConfiguracionService } from '../../../../../Services/pindust-configuracion.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-configuration-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './configuration-detail.component.html',
  styleUrls: ['./configuration-detail.component.scss'],
})
export class ConfigurationDetailComponent implements OnInit {
  form!: FormGroup;
  isNew: boolean = false;
  id!: string;
  loading: boolean = true;
  error: string | null = null;


  campos = [
    'id','emisorDIR3', 'respresidente',  'eMailPresidente', 'directorGeneralPolInd', 'eMailDGeneral',
    'directorGerenteIDI', 'eMailDGerente',
    'convocatoria_aviso_ca', 'convocatoria_aviso_es', 'activeGeneralData'
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private configService: PindustConfiguracionService
  ) {}

  ngOnInit(): void {
  this.id = this.route.snapshot.paramMap.get('id')!;
  this.isNew = this.id === 'new';

  this.form = this.fb.group({});
  this.campos.forEach(campo => {
    this.form.addControl(campo, this.fb.control('', Validators.required));
  });

  if (!this.isNew) {
    this.loading = true;
    this.configService.getById(+this.id).subscribe({
      next: (data) => {
        this.form.patchValue(data);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar la configuración.';
        console.error(err);
        this.loading = false;
      }
    });
  } else {
    this.loading = false;
  }
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const data: ConfigurationModelDTO = this.form.value;

    if (this.isNew) {
      this.configService.create(data).subscribe({
        next: () => this.volver(),
        error: err => {
          alert('Error al crear configuración');
          console.error(err);
        }
      });
    } else {
      this.configService.update(+this.id, data).subscribe({
        next: () => this.volver(),
        error: err => {
          alert('Error al actualizar configuración');
          console.error(err);
        }
      });
    }
  }

  onDelete(): void {
    if (confirm('¿Estás seguro de eliminar esta configuración?')) {
      this.configService.delete(+this.id).subscribe({
        next: () => this.volver(),
        error: err => {
          alert('Error al eliminar');
          console.error(err);
        }
      });
    }
  }

  volver(): void {
    this.router.navigate(['/configuracion']);
  }
}
