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
import { PrDevinitivaDESFavorable_ConReqService } from '../../../Services/xecs-actos-admin/14-pr-definitiva-desfavorable-con-req.service';
import { PrDevinitivaDESFavorableService } from '../../../Services/xecs-actos-admin/13-pr-definitiva-desfavorable.service';
import { PrDevinitivaFavorable_ConReqService } from '../../../Services/xecs-actos-admin/12-pr-definitiva-favorable-con-req.service';
import { PrDevinitivaFavorableService } from '../../../Services/xecs-actos-admin/11-pr-definitiva-favorable.service';

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


  constructor(private prDefinitivaFavorable: PrDevinitivaFavorableService,
              private prDefinitivaFavorableConReq: PrDevinitivaFavorable_ConReqService,
              private prDefinitivaDesfavorable: PrDevinitivaDESFavorableService,
              private prDefinitivaDesfavorableConReq: PrDevinitivaDESFavorable_ConReqService) {}

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
  documentoSended: string = ""
  hayRequerimiento: boolean = false


ngOnInit(): void {
  this.currentYear = new Date().getFullYear().toString();
  this.form = this.fb.group({
    convocatoria: [new Date().getFullYear()],
    tipoTramite: [[]],
    situacion: [[]]
  });
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
    //this.loadExpedientes();
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

loadAllExpedientes(): void {
  this.loading = true;
  this.expedienteService.getAllLineExpedientes('XECS', this.currentYear).subscribe({
   next: (expedientes: any) => {

    expedientes.map ((item:any) => {
      // Limpio campos de fecha
      const invalidDates = ['0000-00-00', '0000-00-00 00:00:00'];
      if (invalidDates.includes(item.fecha_requerimiento_notif)) item.fecha_requerimiento_notif = null;
      if (invalidDates.includes(item.fecha_not_propuesta_resolucion_prov)) item.fecha_not_propuesta_resolucion_prov = null;
      if (invalidDates.includes(item.fecha_limite_justificacion)) item.fecha_limite_justificacion = null;
      if (invalidDates.includes(item.fecha_not_propuesta_resolucion_def_sended)) item.fecha_not_propuesta_resolucion_def_sended = null;

      // Calculo días restantes y fecha vencimiento
      if (item.fecha_not_propuesta_resolucion_prov) {
        item.PRDefinitivaDate = this.commonService.calculateDueDate(item.fecha_not_propuesta_resolucion_prov, 10);
        item.PRDefinitivarestingDays = this.commonService.calculateRestingDays(item.PRDefinitivaDate);
      }
      if (item.fecha_limite_justificacion) {
        item.justificacionRestingDays = this.commonService.calculateRestingDays(item.fecha_limite_justificacion);
      }
      if (item.situacion === 'notificadoIFPRProvPago') {
        item.situacion = 'PR Provisional';
      }
      // --- Mensajes en la Vista ---
      if (!item.fecha_not_propuesta_resolucion_def_sended && item.fecha_not_propuesta_resolucion_def_sended !== '0000-00-00') 
      {item.message = `En data: ${item.PRDefinitivaDate}<br>s'enviará a signatura l'acte administratiu:<br>`;}
      else
      {item.message = `En data: ${item.fecha_not_propuesta_resolucion_def_sended}<br>s'ha enviat a signatura l'acte administratiu:<br> `;}
      
      if (item.fecha_requerimiento_notif !== null && item.propuesta_resolucion_favorable === '1') {
        item.message += "plt-propuesta-resolucion-definitiva-favorable-con-requerimiento.pdf";
      } else if (item.fecha_requerimiento_notif !== null && item.propuesta_resolucion_favorable === '0') {
        item.message += "plt-propuesta-resolucion-definitiva-desfavorable-con-requerimiento.pdf";
      } else if (item.fecha_requerimiento_notif === null && item.propuesta_resolucion_favorable === '1') {
        item.message += "plt-propuesta-resolucion-definitiva-favorable-sin-requerimiento.pdf";
      } else if (item.fecha_requerimiento_notif === null && item.propuesta_resolucion_favorable === '0') {
        item.message += "plt-propuesta-resolucion-definitiva-desfavorable-sin-requerimiento.pdf";
      }

      // Acorto texto de tipo_tramite
      if (item.tipo_tramite === "Programa III actuacions corporatives") item.tipo_tramite = "Programa III a.c.";
      if (item.tipo_tramite === "Programa III actuacions producte") item.tipo_tramite = "Programa III a.p.";
      item.generatedActo13 = false // flag
    })

    expedientes.forEach((expediente:any) => {
      if (expediente.fecha_not_propuesta_resolucion_def_sended === null && expediente.PRDefinitivarestingDays <= 0 && !expediente.generatedActo12 &&
        expediente.fecha_requerimiento_notif !== null && expediente.propuesta_resolucion_favorable === '1') {
        // Caso 12: PR definitiva favorable con requerimiento
        // console.log ("Caso 12: PR definitiva favorable con requerimiento", expediente.propuesta_resolucion_favorable, expediente.id)
        //this.generateActAdmin12(expediente)
      } 
      if (expediente.fecha_not_propuesta_resolucion_def_sended === null && expediente.PRDefinitivarestingDays <= 0 && !expediente.generatedActo14 &&
        expediente.fecha_requerimiento_notif !== null && expediente.propuesta_resolucion_favorable === '0') {
        // Caso 14: PR definitiva desfavorable con requerimiento
        // console.log ("Caso 14: PR definitiva desfavorable con requerimiento", expediente.propuesta_resolucion_favorable, expediente.id)
        //this.generateActAdmin14(expediente)
      } 
      if (expediente.fecha_not_propuesta_resolucion_def_sended === null && expediente.PRDefinitivarestingDays <= 0 && !expediente.generatedActo11 &&
        expediente.fecha_requerimiento_notif === null && expediente.propuesta_resolucion_favorable === '1') {
        // Caso 11: PR definitiva favorable sin requerimiento
        console.log ("expediente.generatedActo11", expediente.generatedActo11)
        this.generateActAdmin11(expediente)
      } 
      if (expediente.fecha_not_propuesta_resolucion_def_sended === null && expediente.PRDefinitivarestingDays <= 0 && !expediente.generatedActo13 && 
        expediente.fecha_requerimiento_notif === null && expediente.propuesta_resolucion_favorable === '0') {
        // Caso 13: PR definitiva desfavorable sin requerimiento
        console.log ("expediente.generatedActo13", expediente.generatedActo13)
        //console.log ("Caso 13: PR definitiva desfavorable sin requerimiento", expediente.propuesta_resolucion_favorable, expediente.id)
        this.generateActAdmin13(expediente)

      }
    })

    this.expedientesFiltrados = expedientes;
    this.actualizarTabla(expedientes);
    const paginaGuardada = sessionStorage.getItem('paginaExpedientes');
    if (paginaGuardada) {
      this.paginator.pageIndex = +paginaGuardada;
    }
    this.dataSource.paginator = this.paginator;
    this.uniqueTiposTramite = [...new Set<string>(expedientes.map((e: any) => e.tipo_tramite))];
    this.commonService.showSnackBar('XECS: expedientes cargados correctamente ✅');
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

private generateActAdmin11(item:any) {
this.prDefinitivaFavorable.generateActoAdmin(item.id, item.nif, item.convocatoria, '11_propuesta_resolucion_definitiva_favorable_sin_requerimiento',
  'XECS', item.tipo_tramite, 'doc_prop_res_definitiva_sin_req', item.fecha_solicitud, item.fecha_firma_propuesta_resolucion_prov,
  item.fecha_not_propuesta_resolucion_prov, item.fecha_infor_fav_desf, item.idExp, 'prop_res_def_favorable_sin_req', item.empresa, item.ImporteSolicitud)
   .subscribe((result:boolean)=>{ 
      item.generatedActo11 = result
     })
}

private generateActAdmin12(item:any) {
  this.prDefinitivaFavorableConReq.generateActoAdmin(item.id, item.nif, item.convocatoria, '12_propuesta_resolucion_definitiva_favorable_con_requerimiento',
    'XECS', item.tipo_tramite, 'doc_prop_res_definitiva_con_req', item.fecha_solicitud, item.fecha_firma_propuesta_resolucion_prov,
    item.fecha_not_propuesta_resolucion_prov, item.fecha_infor_fav_desfg, item.idExp, 'prop_res_def_favorable_con_req', item.empresa, item.ImporteSolicitud, '', '')
    .subscribe()
  item.generatedActo12 = true
}

private generateActAdmin13(item:any) {
  this.prDefinitivaDesfavorable.generateActoAdmin(item.id, item.nif, item.convocatoria, '13_propuesta_resolucion_definitiva_desfavorable_sin_requerimiento',
    'XECS', item.tipo_tramite, 'doc_prop_res_definitiva_sin_req', item.fecha_solicitud, item.fecha_firma_propuesta_resolucion_prov,
    item.fecha_not_propuesta_resolucion_prov, item.fecha_infor_fav_desf, item.motivoDenegacion, item.idExp, item.empresa, item.importeAyuda)
    .subscribe((result:boolean)=>{ 
      item.generatedActo13 = result
     })
}

private generateActAdmin14(item:any) {
  this.prDefinitivaDesfavorableConReq.generateActoAdmin(item.id, item.nif, item.convocatoria, '14_propuesta_resolucion_definitiva_desfavorable_con_requerimiento',
    'XECS', item.tipo_tramite, 'doc_prop_res_definitiva_con_req', item.fecha_solicitud, item.fecha_firma_propuesta_resolucion_prov,
    item.fecha_not_propuesta_resolucion_prov, item.fecha_infor_fav_desf, item.motivoDenegacion, item.idExp, item.empresa, item.importeAyuda, '', '')
    .subscribe()
  item.generatedActo14 = true
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
  if (item.situacion === 'emitirIFPRProvPago' || item.situacion === 'notificadoIFPRProvPago' || item.situacion === 'PR Provisional') {
    const reqNotif = item.fecha_requerimiento_notif && item.fecha_requerimiento_notif !== '0000-00-00';
    this.hayRequerimiento = reqNotif ? true : false
    return { text: (reqNotif ? 'CONREQUERIMIENTO' : 'SINREQUERIMIENTO'), isDayDiffNegative: false };
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
    case 'pr provisional':
      return 'st-notificadoIFPRProvPago';  // Emitido informe Favorable propuesta resolución provisional OK             
    default:
      return 'st-desconocido'; // ❓ Estado no reconocido
  }
}
}