import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { HttpClientModule } from '@angular/common/http';
import { ExpedienteService } from '../../../Services/expediente.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-xecs-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    HttpClientModule,
    MatSnackBarModule,
    MatSelectModule 
  ],
  templateUrl: './xecs-management.component.html',
  styleUrls: ['./xecs-management.component.scss']
})
export class XecsManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private expedienteService = inject(ExpedienteService);
  private snackBar = inject(MatSnackBar);
  uniqueConvocatorias: number[] = [];
  uniqueTiposTramite: string[] = [];

  form!: FormGroup;
  displayedColumns: string[] = ['id', 'zipCode', 'town', 'nombreSolicitante'];
  dataSource: any[] = [];
  loading = false;

ngOnInit(): void {
  const currentYear = new Date().getFullYear();
  this.form = this.fb.group({
    convocatoria: [currentYear],
    tipoTramite: ['Programa I'] // o '' si prefieres enviar string vacío
  });

  this.loadExpedientes();
}


loadExpedientes(): void {
  const { convocatoria, tipoTramite } = this.form.value;
  this.loading = true;

  this.expedienteService.getExpedientesByConvocatoriaAndTipoTramite(convocatoria, tipoTramite).subscribe({
    next: (res) => {
      this.dataSource = res;
      // Extrae valores únicos
      this.uniqueConvocatorias = [...new Set<number>( res.map((e: any) => Number(e.convocatoria)))];
      this.uniqueTiposTramite = [...new Set<string>( res.map((e: any) => e.tipo_tramite))];

      this.snackBar.open('Expedientes cargados correctamente ✅', 'Cerrar', {
        duration: 5000,
        panelClass: 'snack-success'
      });
    },

    error: (err) => {
      this.dataSource = [];
      if (err.status === 404 && err.error?.messages?.error) {
        this.snackBar.open(err.error.messages.error, 'Cerrar', {
          duration: 5000,
          panelClass: 'snack-warning'
        });
      } else {
        console.error('Error inesperado:', err);
        this.snackBar.open('Ocurrió un error inesperado ❌', 'Cerrar', {
          duration: 4000,
          panelClass: 'snack-error'
        });
      }
    },
    complete: () => {
      this.loading = false;
    }
  });
}


}
