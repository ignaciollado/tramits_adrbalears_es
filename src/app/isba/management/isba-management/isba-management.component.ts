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
import { TranslateModule } from '@ngx-translate/core';
import { PrDefinitivaFavorableAdrIsbaService } from '../../../Services/adr-isba-actos-admin/7-pr-definitiva-favorable/pr-definitiva-favorable.service';
import { PrDefinitivaFavorableConRequerimientoAdrIsbaService } from '../../../Services/adr-isba-actos-admin/8-pr-definitiva-favorable-con-requerimiento/pr-definitiva-favorable-con-requerimiento.service';
import { CommonService } from '../../../Services/common.service';
import { ExpedienteService } from '../../../Services/expediente.service';

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
    MatSnackBarModule, RouterModule,
    MatSelectModule, MatButtonModule,
    TranslateModule
  ],
  templateUrl: './isba-management.component.html',
  styleUrls: ['./isba-management.component.scss']
})
export class IsbaManagementComponent implements OnInit, AfterViewInit {

  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private fb = inject(FormBuilder);
  private expedienteService = inject(ExpedienteService);
  private commonService = inject(CommonService)

  private prDefinitivaFavorableConRequerimientoService = inject(PrDefinitivaFavorableConRequerimientoAdrIsbaService);
  private prDefinitivaFavorableService = inject(PrDefinitivaFavorableAdrIsbaService);

  uniqueConvocatorias: number[] = [2026, 2025, 2024, 2023, 2022, 2021];
  uniqueSituaciones: any[] = [];
  expedientesFiltrados: any[] = [];
  filtrosAplicados: boolean = false;
  currentYear!: string;

  form!: FormGroup;
  displayedColumns: string[] = ['fecha_solicitud', 'tipo_tramite', 'idExp', 'empresa', 'importe_ayuda_solicita_idi_isba',
    'ordenDePago', 'empresa_consultor', 'nom_consultor', 'fecha_not_propuesta_resolucion_def',
    'situacion'];
  loading = false;

  hayRequerimiento!: boolean;

  ngOnInit(): void {
    this.currentYear = new Date().getFullYear().toString();

    this.form = this.fb.group({
      convocatoria: [new Date().getFullYear()],
      situacion: [[]]
    });

    this.commonService.getSituations().subscribe((situations: any[]) => {
      this.uniqueSituaciones = situations
    })

    // Verifica filtros ya existentes
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

  // Primera carga
  loadAllExpedientes(): void {
    this.loading = true;
    this.expedienteService.getAllLineExpedientes('ADR-ISBA', this.currentYear).subscribe({
      next: (res) => {

        // Transformación de datos y añadidos.
        res = res.map((item: any) => {
          if (item.situacion === "notificadoIFPRProvPago") {
            item.situacion = "PR Provisional";
            if (item.fecha_not_propuesta_resolucion_prov) {
              item.PRDefinitivaDate = this.commonService.calculateDueDate(item.fecha_not_propuesta_resolucion_prov, 10);
              item.PRDefinitivarestingDays = this.commonService.calculateRestingDays(item.PRDefinitivaDate);
            }
          }
          return item;
        });

        // Generación PR Definitiva
        res.forEach((item: any) => {
          if (item.situacion === "PR Provisional" && item.PRDefinitivarestingDays <= 0 && !item._prDefinitivaEjecutada && (!item.fecha_not_propuesta_resolucion_def_sended || item.fecha_not_propuesta_resolucion_def_sended === "0000-00-00")) {
            this.generatePrDefinitiva(item);
            item._prDefinitivaEjecutada = true; // Flag para evitar ejecuciones duplicadas
          }
        });

        // Guardado de expedientes
        this.expedientesFiltrados = res;

        // Aplicar filtros si requiere
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
        const paginaGuardada = sessionStorage.getItem("paginaExpedientes");

        if (paginaGuardada && this.paginator) {
          this.paginator.pageIndex = +paginaGuardada;
        }

        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }

        this.commonService.showSnackBar('ADR-ISBA: expedientes cargados correctamente ✅')
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
    });
  }

  // Necesario para cargar aquellos que cumplan con los filtros
  loadExpedientes(): void {
    const { convocatoria, situacion } = this.form.value

    if (!convocatoria) {
      this.commonService.showSnackBar('Selecciona una convocatoria 🧐');
      return
    }

    this.loading = true;

    // Guardar filtros en sessionStorage
    sessionStorage.setItem('filtroConvocatoria', convocatoria.toString())
    sessionStorage.setItem('filtroSituacion', JSON.stringify(situacion));

    // Filtrar sobre los expedientes ya cargados
    let filtrados = this.expedientesFiltrados.filter(
      (e: any) => Number(e.convocatoria) === Number(convocatoria)
    );

    if (situacion?.length) {
      filtrados = filtrados.filter(
        (e: any) => situacion.includes(e.situacion)
      );
    }

    this.filtrosAplicados = (convocatoria !== new Date().getFullYear())
      || (situacion?.length > 0)

    if (this.paginator) {
      this.paginator.pageIndex = 0;
      sessionStorage.setItem('paginaExpedientes', '0')
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
    this.loadAllExpedientes();
    this.filtrosAplicados = false
  }

  getSituacionSuffix(item: any): { text: string, isDayDiffNegative: boolean } {
    if (item.situacion === 'emitirIFPRProvPago' || item.situacion === "notificadoIFPRProvPago" || item.situacion === "PR Provisional") {
      const reqNotif = item.fecha_requerimiento_notif && item.fecha_requerimiento_notif !== "0000-00-00";
      this.hayRequerimiento = reqNotif ? true : false;
      return { text: (reqNotif ? 'CONREQUERIMIENTO' : 'SINREQUERIMIENTO'), isDayDiffNegative: false }
    }

    return { text: '', isDayDiffNegative: false }
  }

  situacionClass(value: string): string {

    const key = value?.toLowerCase().trim();
    switch (key) {
      case 'nohapasadorec':
        return 'st-nohapasadorec'; // ⛔ Rechazado por no pasar REC               OK
      case 'encurso':
        return 'st-en-curso'; // 🔵 Estado activo o en desarrollo
      case 'pendientejustificar':
        return 'st-pendiente-justificar'; // 🟡 Pendiente de justificar
      case 'pendiente':
        return 'st-pendiente'; // 🟡 Pendiente de validar                         OK
      case 'pendienterecjustificar':
        return 'st-pendiente-rec'; // 🟠 Pendiente justificante SEU
      case 'aprobado':
        return 'st-aprobado'; // 🟢 Aprobado formalmente
      case 'denegado':
        return 'st-denegado'; // 🔴 Denegado oficialmente                         OK
      case 'justificado':
        return 'st-justificado'; // 🟣 Justificación completada                   OK
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
      case 'emitirrespagoyjust':
        return 'st-emitirResPagoyJust'; // Emitir resolución de pago y justificación    OK
      case 'emitidorespagoyjust':
        return 'st-emitidoResPagoyJust'; // Emitida resolución de pago y justificación  OK
      case 'emitidodesenmienda':
        return 'st-emitidoDesEnmienda'; // Emitido desestimiento por enmienda           OK   
      case 'emitirifprprovpago':
        return 'st-emitirIFPRProvPago'; // Emitir informe Favorable propuesta resolución provisional OK
      case 'notificadoifprprovpago':
      case 'pr provisional':
        return 'st-notificadoIFPRProvPago';  // Emitido informe Favorable propuesta resolución provisional OK             
      default:
        return 'st-desconocido'; // ❓ Estado no reconocido
    }
  }

  // Generador PR Definitiva con o sin requerimiento.
  generatePrDefinitiva(item: any) {
    if (item.fecha_requerimiento !== "0000-00-00") {
      this.prDefinitivaFavorableConRequerimientoService.init(item, true);
    } else {
      this.prDefinitivaFavorableService.init(item, true);
    }
  }
}
