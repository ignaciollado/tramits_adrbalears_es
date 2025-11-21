import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AfterViewInit, Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { CommonService } from '../../../Services/common.service';
import { ExpedienteService } from '../../../Services/expediente.service';
import { TranslateModule } from '@ngx-translate/core';


@Component({
  selector: 'app-ils-management',
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
    MatSnackBarModule, RouterModule,
    MatSelectModule, MatButtonModule,
    TranslateModule
  ],
  templateUrl: './ils-management.component.html',
  styleUrls: ['./ils-management.component.scss']
})
export class IlsManagementComponent implements OnInit, AfterViewInit {

  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private fb = inject(FormBuilder)
  private expedienteService = inject(ExpedienteService)
  private commonService = inject(CommonService)
  uniqueConvocatorias: number[] = [2026, 2025, 2024, 2023, 2022, 2021]
  uniqueSituaciones: any[] = [];
  expedientesFiltrados: any[] = [];
  filtrosAplicados: boolean = false;
  currentYear!: string;

  form!: FormGroup;
  displayedColumns: string[] = ['fecha_solicitud', 'tipo_tramite', 'idExp', 'empresa', 'importeAyuda',
    'ordenDePago', 'empresa_consultor', 'nom_consultor', 'fecha_not_propuesta_resolucion_def',
    'situacion'];
  loading = false;

  ngOnInit(): void {
    this.currentYear = new Date().getFullYear().toString();

    this.form = this.fb.group({
      convocatoria: [new Date().getFullYear()],
      situacion: [[]]
    });

    this.limpiarFiltros();

    this.commonService.getIlsSituations().subscribe((situations: any[]) => {
      this.uniqueSituaciones = situations;
    })

    // Verifica si hay filtros guardados y si los valores son válidos
    let savedConv = sessionStorage.getItem('filtroConvocatoria');
    let savedSit = sessionStorage.getItem('filtroSituacion');

    if (savedConv || savedSit) {
      this.form.patchValue({
        convocatoria: savedConv ? +savedConv : this.currentYear,
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
      sessionStorage.setItem('paginaExpedientes', this.paginator.pageIndex.toString());
    });

    this.sort.sortChange.subscribe(sort => {
      sessionStorage.setItem('tablaOrden', JSON.stringify(sort));
    });

  }

  loadAllExpedientes(): void {
    this.loading = true;
    this.expedienteService.getAllLineExpedientes('ILS', this.currentYear).subscribe({
      next: (res) => {
        this.expedientesFiltrados = res;
        this.actualizarTabla(this.expedientesFiltrados)

        const paginaGuardada = sessionStorage.getItem('paginaExpedientes')
        if (paginaGuardada) {
          this.paginator.pageIndex = +paginaGuardada;
        }
        this.dataSource.paginator = this.paginator;

        this.commonService.showSnackBar('ILS: expedientes cargados correctamente ✅')
      },

      error: (err) => {
        this.dataSource.data = [];
        if (err.status === 404 && err.error?.messages?.error) {
          this.commonService.showSnackBar(err.error.messages.error)
        } else {
          console.error('Error inesperado:', err);
          this.commonService.showSnackBar('Ocurrió un error inesperado ❌')
        }
      },

      complete: () => {
        this.loading = false;
      }
    })
  }

  loadExpedientes(): void {
    const { convocatoria, situacion } = this.form.value

    if (!convocatoria) {
      this.commonService.showSnackBar('Selecciona una convocatoria 🧐');
      return;
    }

    this.loading = true;

    sessionStorage.setItem('filtroConvocatoria', convocatoria.toString());
    sessionStorage.setItem('filtroSituacion', situacion || '');

    let filtrados = this.expedientesFiltrados.filter(
      (e: any) => Number(e.convocatoria) === Number(convocatoria)
    );

    if (situacion?.length) {
      filtrados = filtrados.filter((e: any) => situacion.includes(e.situacion))
    }

    this.filtrosAplicados = (convocatoria !== new Date().getFullYear())
      || (situacion?.length > 0)

    if (this.paginator) {
      this.paginator.pageIndex = 0;
      sessionStorage.setItem('paginaExpedientes', '0');
    }

    this.actualizarTabla(filtrados);
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    this.commonService.showSnackBar('Expedientes filtrados correctamente ✅');
    this.loading = false;
  }


  private actualizarTabla(res: any[]): void {
    this.dataSource.data = res;

    const ordenGuardado = sessionStorage.getItem('tablaOrden');
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
    this.form.get('convocatoria')?.setValue(new Date().getFullYear())
    this.form.get('situacion')?.reset()
    sessionStorage.removeItem('filtroConvocatoria')
    sessionStorage.removeItem('filtroTipoTramite')
    sessionStorage.removeItem('filtroSituacion')
    this.loadAllExpedientes()
    this.filtrosAplicados = false
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
