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
import { MatButtonModule } from '@angular/material/button';

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
    MatSelectModule, MatButtonModule
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
  uniqueSituaciones: string[] = [];

  form!: FormGroup;
  displayedColumns: string[] = ['fechaComletado', 'tipo_tramite', 'idExp', 'empresa', 'importeAyuda', 
    'ordenDePago', 'empresa_consultor', 'nom_consultor', 'fecha_not_propuesta_resolucion_def',
     'situacion'];
  loading = false;

ngOnInit(): void {
  this.form = this.fb.group({
    convocatoria: [null],
    tipoTramite: [[]],
    situacion: [[]]
  });

  // Verifica si hay filtros guardados y si los valores son válidos
  const savedConv = localStorage.getItem('filtroConvocatoria');
  const savedTipo = localStorage.getItem('filtroTipoTramite');
  const savedSit = localStorage.getItem('filtroSituacion');

  if (savedConv) {
    this.form.patchValue({
      convocatoria: +savedConv,
      tipoTramite: savedTipo ? JSON.parse(savedTipo) : [],
      situacion: savedSit ? JSON.parse(savedSit) : []
    });
    this.loadExpedientes();
  } else {
    this.loadAllExpedientes();
  }
}

ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;

    this.paginator.page.subscribe(() => {
      localStorage.setItem('paginaExpedientes', this.paginator.pageIndex.toString());
    });

  this.sort.sortChange.subscribe(sort => {
    localStorage.setItem('tablaOrden', JSON.stringify(sort));
  });
    
}

loadAllExpedientes(): void {
  this.loading = true;

  this.expedienteService.getAllExpedientes().subscribe({
    next: (res) => {
      // Excluir expedientes con tipo_tramite 'ILS' o 'ADR-ISBA'
      const expedientesFiltrados = res.filter(
        (e: any) => e.tipo_tramite !== 'ILS' && e.tipo_tramite !== 'ADR-ISBA'
      );

      this.actualizarTabla(expedientesFiltrados);

      const paginaGuardada = localStorage.getItem('paginaExpedientes');
      if (paginaGuardada) {
        this.paginator.pageIndex = +paginaGuardada;
      }
      this.dataSource.paginator = this.paginator;

      this.uniqueConvocatorias = [
        ...new Set<number>(expedientesFiltrados.map((e: any) => Number(e.convocatoria)))
      ];

      this.uniqueTiposTramite = [
        ...new Set<string>(expedientesFiltrados.map((e: any) => e.tipo_tramite))
      ];

      this.uniqueSituaciones = [
        ...new Set(expedientesFiltrados.map((e: any) => e.situacion).filter(Boolean))
      ];

      this.snackBar.open('XECS: expedientes cargados correctamente ✅', 'Cerrar', {
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
  const { convocatoria, tipoTramite, situacion } = this.form.value;

  if (!convocatoria) {
    this.snackBar.open('Selecciona una convocatoria 🧐', 'Cerrar', {
      duration: 4000,
      panelClass: 'snack-warning'
    });
    return;
  }

  this.loading = true;
  localStorage.setItem('filtroConvocatoria', convocatoria.toString());
  localStorage.setItem('filtroTipoTramite', JSON.stringify(tipoTramite));
  localStorage.setItem('filtroSituacion', situacion || '');

  this.expedienteService.getExpedientesByConvocatoria(convocatoria).subscribe({
    next: (res) => {
      let filtrados = res;


    // Filtrar por tipo de trámite si hay selección
    if (tipoTramite?.length) {
      filtrados = filtrados.filter((e: any) => tipoTramite.includes(e.tipo_tramite));
    }

    // Filtrar por situación si hay selección
    if (situacion?.length) {
      filtrados = filtrados.filter((e: any) => situacion.includes(e.situacion));
    }

      this.paginator.pageIndex = 0;
      localStorage.setItem('paginaExpedientes', '0');

      this.actualizarTabla(filtrados);
      this.dataSource.paginator = this.paginator;

      this.snackBar.open('Expedientes filtrados correctamente ✅', 'Cerrar', {
        duration: 5000,
        panelClass: 'snack-success'
      });
    },
    error: (err) => {
      this.dataSource.data = [];
      const backendMessage = err.error?.messages?.error || err.message || 'Error sin mensaje definido';
      this.snackBar.open(`❌ Error: ${backendMessage}`, 'Cerrar', {
        duration: 7000,
        panelClass: 'snack-error'
      });
    },
    complete: () => {
      this.loading = false;
    }
  });
}


private actualizarTabla(res: any[]): void {
  this.dataSource.data = res;

  const ordenGuardado = localStorage.getItem('tablaOrden');
  if (ordenGuardado) {
    const { active, direction } = JSON.parse(ordenGuardado);
    this.sort.active = active;
    this.sort.direction = direction;
    this.sort.sortChange.emit({ active, direction });
  }
  this.dataSource.sort = this.sort;
  this.dataSource.paginator = this.paginator;

  // 👇 Aquí colocas tu filtro personalizado
  this.dataSource.filterPredicate = (data, filter) => {
    const searchable = `${data.empresa} ${data.localidad} ${data.situacion}`.toLowerCase();
    return searchable.includes(filter);
  };
}

aplicarFiltro(event: Event): void {
  const filterValue = (event.target as HTMLInputElement).value;
  this.dataSource.filter = filterValue.trim().toLowerCase();
}

limpiarFiltros(): void {
  this.form.reset();
  localStorage.removeItem('filtroConvocatoria');
  localStorage.removeItem('filtroTipoTramite');
  this.paginator.pageIndex = 0;
  localStorage.setItem('paginaExpedientes', '0');
  this.loadAllExpedientes();
}

situacionClass(value: string): string {
  const key = value?.toLowerCase().trim();

  switch (key) {
    case 'encurso':
      return 'st-en-curso'; // 🔵 Estado activo o en desarrollo
    case 'pendientejustificar':
      return 'st-pendiente-justificar'; // 🟡 Esperando justificación
    case 'pendiente':
      return 'st-pendiente'; // 🟡 Pendiente general
    case 'pendienterecjustificar':
      return 'st-pendiente-rec'; // 🟠 Pendiente de REC para justificar
    case 'aprobado':
      return 'st-aprobado'; // 🟢 Aprobado formalmente
    case 'denegado':
      return 'st-denegado'; // 🔴 Denegado oficialmente
    case 'justificado':
      return 'st-justificado'; // 🟣 Justificación completada
    case 'enmienda':
      return 'st-enmienda'; // 🟤 En proceso de subsanación o corrección
    case 'desestimiento':
      return 'st-desestimiento'; // ⚪ Retirado por el solicitante
    case 'finalizado':
      return 'st-finalizado'; // ✅ Trámite cerrado/completado
    case 'emitidorc':
      return 'st-emitido-rc'; // 🔷 Emitido resolución con requerimiento
    case 'emitidord':
      return 'st-emitido-rd'; // 🔷 Emitido resolución definitiva
    case 'emitidoidpd':
      return 'st-emitido-idpd'; // 🔷 Emitido para IDPD
    case 'emitidoifps':
      return 'st-emitido-ifps'; // 🔷 Emitido IFPS
    case 'emitirrc':
      return 'st-emitir-rc'; // ⏳ Listo para emitir resolución con requerimiento
    case 'emitirrd':
      return 'st-emitir-rd'; // ⏳ Listo para emitir resolución definitiva
    case 'emitiridpd':
      return 'st-emitir-idpd'; // ⏳ Pendiente de emisión para IDPD
    case 'inicioconsultoria':
      return 'st-consultoria'; // 🧠 Consultoría en marcha
    case 'nohapasadorec':
      return 'st-rechazado'; // ⛔ Rechazado por no pasar REC
    default:
      return 'st-desconocido'; // ❓ Estado no reconocido
  }
}
}
