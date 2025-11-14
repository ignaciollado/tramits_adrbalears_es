import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { HttpClientModule } from '@angular/common/http';
import { ExpedienteService } from '../../../Services/expediente.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { ViewChild, AfterViewInit } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { CommonService } from '../../../Services/common.service';

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
    MatInputModule, TranslateModule,
    HttpClientModule,
    MatSnackBarModule, RouterModule, 
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
  private commonService = inject(CommonService)

  uniqueConvocatorias: number[] = [2025, 2024, 2023, 2022, 2021];
  uniqueTiposTramite: string[] = [];
  uniqueSituaciones: any[] = [];
  expedientesFiltrados: any[] = []
  filtrosAplicados:boolean = false;
  currentYear!: string 
  
  form!: FormGroup;
  displayedColumns: string[] = ['fecha_completado', 'tipo_tramite', 'idExp', 'empresa', 'importeAyuda', 
    'ordenDePago', 'empresa_consultor', 'nom_consultor', 'fecha_not_propuesta_resolucion_def',
     'situacion'];
  loading = false;

ngOnInit(): void {
  
  this.currentYear = new Date().getFullYear().toString();
  this.form = this.fb.group({
    convocatoria: [new Date().getFullYear()],
    tipoTramite: [[]],
    situacion: [[]]
  });
  this.limpiarFiltros()
  this.commonService.getSituations().subscribe((situations: any[]) => {
    this.uniqueSituaciones = situations;
  })

  // Verifica si hay filtros guardados y si los valores son válidos
  let savedConv = sessionStorage.getItem('filtroConvocatoria');
  let savedTipo = sessionStorage.getItem('filtroTipoTramite');
  let savedSit = sessionStorage.getItem('filtroSituacion');

  if (savedConv || savedTipo || savedSit) {
    this.filtrosAplicados = true; // ✅ Hay filtros guardados
    this.form.patchValue({
      convocatoria: savedConv ? +savedConv : this.currentYear,
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
      sessionStorage.setItem('paginaExpedientes', this.paginator.pageIndex.toString());
    });

  this.sort.sortChange.subscribe(sort => {
    sessionStorage.setItem('tablaOrden', JSON.stringify(sort));
  });
    
}

loadAllExpedientes(): void {
  this.loading = true;

  this.expedienteService.getAllLineExpedientes('XECS', this.currentYear).subscribe({
    next: (res) => {
      res = res.map((item: any) => {
        if (item.fecha_not_propuesta_resolucion_prov === '0000-00-00') {
          item.fecha_not_propuesta_resolucion_prov = ''
        }
        if (item.fecha_not_propuesta_resolucion_prov) {
          item.PRDefinitivaDate = this.commonService.calculateDueDate(item.fecha_not_propuesta_resolucion_prov, 10);
          item.PRDefinitivarestingDays = this.commonService.calculateRestingDays(item.PRDefinitivaDate)
        }

        if (item.fecha_limite_justificacion === '0000-00-00') {
          item.fecha_limite_justificacion = ''
        }
        if (item.fecha_limite_justificacion) {
          item.justificacionRestingDays = this.commonService.calculateRestingDays(item.fecha_limite_justificacion)
        }
        return item;
      });

      this.expedientesFiltrados = res;

      this.actualizarTabla(this.expedientesFiltrados);

      const paginaGuardada = sessionStorage.getItem('paginaExpedientes');
      if (paginaGuardada) {
        this.paginator.pageIndex = +paginaGuardada;
      }
      this.dataSource.paginator = this.paginator;

      this.uniqueTiposTramite = [
        ...new Set<string>(this.expedientesFiltrados.map((e: any) => e.tipo_tramite))
      ];

      this.commonService.showSnackBar('XECS: expedientes cargados correctamente ✅')
    },

    error: (err) => {
      this.dataSource.data = [];
      if (err.status === 404 && err.error?.messages?.error) {
        this.commonService.showSnackBar(err.error.messages.error);
      } else {
        this.commonService.showSnackBar('Ocurrió un error inesperado ❌' + err);
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
    this.commonService.showSnackBar('Selecciona una convocatoria 🧐');
    return;
  }

  this.loading = true;

  // Guardar filtros en sessionStorage
  sessionStorage.setItem('filtroConvocatoria', convocatoria.toString());
  sessionStorage.setItem('filtroTipoTramite', tipoTramite || '');
  sessionStorage.setItem('filtroSituacion', situacion || '');

  // Filtrar sobre los expedientes ya cargados
  let filtrados = this.expedientesFiltrados.filter(
    (e: any) => Number(e.convocatoria) === Number(convocatoria)
  );

  if (tipoTramite?.length) {
    filtrados = filtrados.filter((e: any) =>
      tipoTramite.includes(e.tipo_tramite)
    );
  }

  if (situacion?.length) {
    filtrados = filtrados.filter((e: any) =>
      situacion.includes(e.situacion)
    );
  }

  // Marcar que hay filtros aplicados si alguno está activo
  this.filtrosAplicados = (convocatoria !== new Date().getFullYear()) 
    || (tipoTramite?.length > 0) 
    || (situacion?.length > 0);

  // Esperar a que paginator exista antes de usarlo
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
  this.form.get('tipoTramite')?.reset()
  this.form.get('situacion')?.reset()
  sessionStorage.removeItem('filtroConvocatoria')
  sessionStorage.removeItem('filtroTipoTramite')
  sessionStorage.removeItem('filtroSituacion')
  this.loadAllExpedientes()
  this.filtrosAplicados = false
}

getSituacionSuffix(item: any): { text: string, isDayDiffNegative: boolean } {
  if (item.situacion === 'emitirIFPRProvPago' || item.situacion === 'notificadoIFPRProvPago') {
    const reqNotif = item.fecha_requerimiento_notif && item.fecha_requerimiento_notif !== '0000-00-00';
    return { text: (reqNotif ? 'CONREQUERIMIENTO' : 'SINREQUERIMIENTO'), isDayDiffNegative: false };
  }

  if (item.situacion === 'pendienteJustificar') {
    if (item.fecha_limite_justificacion && item.fecha_limite_justificacion !== '0000-00-00') {
      const fechaLimite = new Date(item.fecha_limite_justificacion);
      const fechaHoy = new Date();
      const diffDias = Math.ceil((fechaLimite.getTime() - fechaHoy.getTime()) / (1000 * 60 * 60 * 24));
      const fechaFormateada = this.commonService.formatDate(fechaLimite);
      return {
        text: `${diffDias} días naturales\n[Fecha máxima de justificación:\n${fechaFormateada}]`,
        isDayDiffNegative: diffDias < 0
      };
    }
  }

  return { text: '', isDayDiffNegative: false };
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
      return 'st-notificadoIFPRProvPago';  // Emitido informe Favorable propuesta resolución provisional OK             
    default:
      return 'st-desconocido'; // ❓ Estado no reconocido
  }
}
}