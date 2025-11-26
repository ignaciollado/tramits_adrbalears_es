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

    this.commonService.getIlsSituations().subscribe((situations: any[]) => {
      this.uniqueSituaciones = situations;
    })

    // Verifica si hay filtros guardados y si los valores son válidos
    let savedConv = sessionStorage.getItem('filtroConvocatoria');
    let savedSit = sessionStorage.getItem('filtroSituacion');

    if (savedConv || savedSit) {
      this.filtrosAplicados = true;
      this.form.patchValue({
        convocatoria: savedConv ? +savedConv : this.currentYear,
        situacion: savedSit ? JSON.parse(savedSit) : []
      });
    }
    this.loadAllExpedientes();
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

  // Mejoro la primera carga de expedientes
  loadAllExpedientes(): void {
    this.loading = true;
    this.expedienteService.getAllLineExpedientes('ILS', this.currentYear).subscribe({
      next: (res) => {

        // Guardado de expedientes
        this.expedientesFiltrados = res;

        // Aplicar filtros si requiere;

        if (this.filtrosAplicados) {
          const convocatoriaAFiltrar = Number(this.form.value.convocatoria);
          const situacionesAFiltrar: string[] = this.form.value.situacion || [];

          const filtrados = this.expedientesFiltrados.filter((item: any) => {
            const matchConvocatoria = Number(item.convocatoria) === convocatoriaAFiltrar;
            const matchSituacion = !situacionesAFiltrar.length || situacionesAFiltrar.includes(item.situacion);

            return matchConvocatoria && matchSituacion;
          });

          this.actualizarTabla(filtrados);
        } else {
          this.actualizarTabla(this.expedientesFiltrados);
        }

        // Aplicar página guardada
        const paginaGuardada = sessionStorage.getItem('paginaExpedientes');

        if (paginaGuardada && this.paginator) {
          this.paginator.pageIndex = +paginaGuardada;
        }

        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }

        this.commonService.showSnackBar('ILS: expedientes cargados correctamente ✅')
      },
      error: (err) => {
        this.dataSource.data = [];
        if (err.status === 404 && err.error?.messages?.error) {
          this.commonService.showSnackBar(err.error.messages.error);
        } else {
          console.error("Error inesperado:", err);
          this.commonService.showSnackBar("Ocurrió un error inesperado ❌");
        }
      },
      complete: () => {
        this.loading = false;
      }
    })
  }

  // Necesario para cargar aquellos expedientes que cumplan con los filtros
  loadExpedientes(): void {
    const { convocatoria, situacion } = this.form.value

    if (!convocatoria) {
      this.commonService.showSnackBar('Selecciona una convocatoria 🧐');
      return;
    }

    this.loading = true;

    sessionStorage.setItem('filtroConvocatoria', convocatoria.toString());
    sessionStorage.setItem('filtroSituacion', JSON.stringify(situacion));

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
    if (ordenGuardado && this.sort) {
      const { active, direction } = JSON.parse(ordenGuardado);
      this.sort.active = active;
      this.sort.direction = direction;
      this.sort.sortChange.emit({ active, direction });
    }

    if (this.sort) {
      this.dataSource.sort = this.sort;
    }

    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }

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


  // ToDo estilos
  situacionClass(value: string): string {

    const key = value?.toLowerCase().trim();
    switch (key) {
      case 'nohapasadorec':
        return 'st-nohapasadorec'; // ⛔ Rechazado por no pasar REC               OK

      case 'pendiente':
        return 'st-pendiente'; // Pendiente de validar                            OK

      case 'reqfirmado':
        return 'st-reqfirmado'; // Requerimiento firmado

      case 'reqnotificado':
        return 'st-reqnotificado'; // Requerimiento notificado + 30 días para subsanar

      case 'ifresolucionemitida':
        return 'st-ifresolucionemitida'; // IF + resolución emitida

      case 'ifresolucionenviada':
        return 'st-ifresolucionenviada'; // IF + resolución enviada

      case 'ifresolucionnotificada':
        return 'st-ifresolucionnotificada'; // IF + resolución notificada

      case 'empresaadherida':
        return 'st-empresaadherida'; // Empresa Adherida

      case 'idresoluciondenegacionemitida':
        return 'st-idresoluciondenegacionemitida'; // ID + resolución denegación emitida

      case 'idresoluciondenegacionenviada':
        return 'st-idresoluciondenegacionenviada'; // ID + resolución denegación enviada

      case 'idresoluciondenegacionnotificada':
        return 'st-idresoluciondenegacionnotificada'; // ID + resolución denegación notificada

      case 'empresadenegada':
        return 'st-empresadenegada'; // Empresa denegada

      case 'pendientejustificar':
        return 'st-pendiente-justificar'; // Pendiente de justificar              OK

      case 'justificantgoib':
        return 'st-justificantgoib'; // Recibido justificante de distribución GOIB

      case 'adhesionrenovada':
        return 'st-adhesionrenovada'; // Adhesión renovada

      default:
        return 'st-desconocido'; // ❓ Estado no reconocido
    }
  }
}
