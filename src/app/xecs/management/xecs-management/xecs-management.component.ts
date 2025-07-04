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
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { ViewChild, AfterViewInit } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-xecs-management',
  standalone: true,
  imports: [
    CommonModule,
    MatSortModule,
    MatPaginatorModule,
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
export class XecsManagementComponent implements OnInit, AfterViewInit {

  dataSource = new MatTableDataSource<any>([]);
  
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private fb = inject(FormBuilder);
  private expedienteService = inject(ExpedienteService);
  private snackBar = inject(MatSnackBar);
  uniqueConvocatorias: number[] = [];
  uniqueTiposTramite: string[] = [];

  form!: FormGroup;
  displayedColumns: string[] = ['idExp', 'empresa', 'tipo_tramite', 'localidad', 'situacion'];
  loading = false;

ngOnInit(): void {
  this.form = this.fb.group({
    convocatoria: [null],
    tipoTramite: [null]
  });
  this.loadAllExpedientes()
}


ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

loadAllExpedientes(): void {
  this.loading = true;

  this.expedienteService.getAllExpedientes().subscribe({
    next: (res) => {
      console.log (res)
      this.dataSource.data = res;
      this.uniqueConvocatorias = [...new Set<number>( res.map((e: any) => Number(e.convocatoria)))];
      this.uniqueTiposTramite = [...new Set<string>( res.map((e: any) => e.tipo_tramite))];

      this.snackBar.open('Expedientes cargados correctamente ✅', 'Cerrar', {
        duration: 5000,
        panelClass: 'snack-success'
      });
    },

    error: (err) => {
      this.dataSource.data = [];
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


loadExpedientes(): void {
  const { convocatoria, tipoTramite } = this.form.value;

  if (!convocatoria || !tipoTramite) {
    this.snackBar.open('Selecciona una convocatoria y un tipo de trámite 🧐', 'Cerrar', {
      duration: 4000,
      panelClass: 'snack-warning'
    });
    return;
  }

  this.loading = true;

  this.expedienteService.getExpedientesByConvocatoriaAndTipoTramite(convocatoria, tipoTramite).subscribe({
    next: (res) => {
      this.dataSource.data = res; // ✅ Corrige esta línea si antes hacías dataSource = res;
      this.snackBar.open('Expedientes cargados correctamente ✅', 'Cerrar', {
        duration: 5000,
        panelClass: 'snack-success'
      });
    },
    error: (err) => {
      this.dataSource.data = [];
      const statusCode = err.status || 'desconocido';
      const backendMessage = err.error?.messages?.error || err.message || 'Error sin mensaje definido';
      const errorDetails = typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
      console.error('Error al cargar expedientes:', {
        status: err.status,
        message: backendMessage,
        detalles: errorDetails
      });

      this.snackBar.open(`❌ Error ${statusCode}: ${backendMessage}`, 'Cerrar', {
        duration: 7000,
        panelClass: 'snack-error'
      });
    },
    complete: () => {
      this.loading = false;
    }
  });
}

situacionClass(value: string): string {
  const key = value?.toLowerCase().trim();
  switch (key) {
    case 'encurso':
      return 'st-en-curso';
    case 'pendientejustificar':
    case 'pendiente':
      return 'st-pendiente';
    case 'aprobado':
      return 'st-aprobado';
    case 'denegado':
      return 'st-denegado';
    case 'justificado':
      return 'st-justificado';
    case 'enmienda':
      return 'st-enmienda';
    case 'desestimiento':
      return 'st-desestimiento';
    case 'finalizado':
      return 'st-finalizado';
    case 'emitidorc':
      return 'st-emitido';
    case 'emitidord':
      return 'st-emitido';
    case 'emitidoidpd':
      return 'st-emitido';
    case 'emitirrc':
    case 'emitirrd':
    case 'emitiridpd':
      return 'st-emitir';
    case 'inicioconsultoria':
      return 'st-consultoria';
    case 'nohapasadorec':
      return 'st-rechazado';
case 'emitidoifps':
  return 'st-emitido';
    default:
      return 'st-desconocido';
  }
}



}
