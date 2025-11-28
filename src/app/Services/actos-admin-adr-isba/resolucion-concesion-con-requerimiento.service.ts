import { inject, Injectable } from '@angular/core';
import { ConfigurationModelDTO } from '../../Models/configuration.dto';
import { finalize, Subject, switchMap, tap } from 'rxjs';
import { PindustLineaAyudaDTO } from '../../Models/linea-ayuda-dto';
import { ActoAdministrativoDTO } from '../../Models/acto-administrativo-dto';
import { ExpedienteService } from '../expediente.service';
import { DocumentoGeneradoDTO } from '../../Models/documentos-generados-dto';
import { CommonService } from '../common.service';
import { ViafirmaService } from '../viafirma.service';
import { ActoAdministrativoService } from '../acto-administrativo.service';
import { DocumentosGeneradosService } from '../documentos-generados.service';
import jsPDF from 'jspdf';
import { formatDate } from '@angular/common';
import { CreateSignatureRequest } from '../../Models/signature.dto';
import { PindustLineaAyudaService } from '../linea-ayuda.service';
import { PindustConfiguracionService } from '../pindust-configuracion.service';

@Injectable({
  providedIn: 'root'
})
export class ResolucionConcesionConRequerimientoService {
  private expedienteService = inject(ExpedienteService);

  expediente!: any;

  // Propiedades del expediente;
  actualID!: number;
  actualIdExp!: number;
  actualConvocatoria!: number;
  actualEmpresa!: string;
  actualNif!: string;
  actualTipoTramite!: string;

  // Propiedades para el documento
  fecha_BOIB!: string;
  num_BOIB!: string;
  codigoSIA!: string;
  dGerente!: string;
  nomPresidenteIdi!: string;

  // Necesario para la subida al backend
  docGeneradoInsert: DocumentoGeneradoDTO = {
    id_sol: 0,
    cifnif_propietario: '',
    convocatoria: '',
    name: '',
    type: '',
    created_at: '',
    tipo_tramite: '',
    corresponde_documento: '',
    selloDeTiempo: '',
    publicAccessId: ''
  };
  lastInsertId: number | undefined;
  nameDocGenerado!: string;

  // Datos del acto
  docDataString!: ActoAdministrativoDTO;
  signedBy!: string;

  // Correos
  technicianEmail!: string;
  ceoEmail!: string;
  consellerEmail!: string;

  // Subject para modificar la vista sin recargarla
  private flujoTerminadoSubject = new Subject<boolean>();

  flujoTerminado$ = this.flujoTerminadoSubject.asObservable();

  constructor(
    private commonService: CommonService,
    private viafirmaService: ViafirmaService,
    private actoAdminService: ActoAdministrativoService,
    private documentosGeneradosService: DocumentosGeneradosService,
    private lineaAyuda: PindustLineaAyudaService,
    private configGlobal: PindustConfiguracionService
  ) { this.technicianEmail = sessionStorage.getItem('tramits_user_email') || '' }

  init(item: any): void {
    this.bindData(item);
    if (!item.doc_res_concesion_con_requerimiento_adr_isba || item.doc_res_concesion_con_requerimiento_adr_isba === "0") {
      this.configGlobal.getActive().pipe(
        tap((globalConfig: ConfigurationModelDTO[]) => {
          /* Quitar hardcodeo de emails */
          // this.ceoEmail = globalConfig[0].eMailDGerente;
          // this.consellerEmail = globalConfig[0].eMailPresidente;

          this.dGerente = globalConfig[0]?.directorGerenteIDI ?? '';
          this.nomPresidenteIdi = globalConfig[0]?.respresidente;

          this.ceoEmail = 'jose.luis@idi.es'
          this.consellerEmail = 'jldejesus@adrbalears.caib.es'
        }),
        switchMap(() => this.lineaAyuda.getAll()),
        tap((lineaAyudaItems: PindustLineaAyudaDTO[]) => {
          const lineDetail = lineaAyudaItems.filter(item =>
            item.convocatoria === this.actualConvocatoria &&
            item.lineaAyuda === "ADR-ISBA" &&
            item.activeLineData === "SI"
          );

          this.num_BOIB = lineDetail[0]?.num_BOIB;
          this.codigoSIA = lineDetail[0]?.codigoSIA;
          this.fecha_BOIB = lineDetail[0]?.fecha_BOIB;

        }),
        switchMap(() => this.actoAdminService.getByNameAndTipoTramite(
          'isba_10_resolucion_concesion_con_requerimiento',
          'ADR-ISBA'
        ))
      ).subscribe({
        next: (docDataString: ActoAdministrativoDTO) => {
          this.docDataString = docDataString;
          this.signedBy = this.docDataString.signedBy;
          this.generateActoAdmin('res_concesion_con_requerimiento_adr_isba');
        },
        error: (err) => console.error('Error en el flujo', err)
      })
    }
  }

  // Vinculación propiedades con los datos del expediente
  bindData(expediente: any): void {
    this.actualID = expediente.id;
    this.actualIdExp = expediente.idExp;
    this.actualEmpresa = expediente.empresa;
    this.actualConvocatoria = expediente.convocatoria;
    this.actualNif = expediente.nif;
    this.actualTipoTramite = expediente.tipo_tramite;

    this.expediente = expediente;
  }

  generateActoAdmin(docFieldToUpdate: string): void {
    const timeStamp = this.commonService.generateCustomTimestamp();
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      floatPrecision: 16
    });

    doc.setProperties({
      title: `${this.actualIdExp}_${this.actualConvocatoria}_${docFieldToUpdate}`,
      subject: 'Tràmits administratius',
      author: 'ADR Balears',
      keywords: 'ayudas, subvenciones, xecs, ils, adr-isba',
      creator: 'Angular App'
    });

    const footerText = 'Plaça de Son Castelló, 1\n07009 Polígon de Son Castelló - Palma\nTel. 971 17 61 61\nwww.adrbalears.es';
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    const marginLeft = 25;
    const lineHeight = 4;
    const pageHeight = doc.internal.pageSize.getHeight();
    const lines = footerText.split('\n');

    const pageWidth = doc.internal.pageSize.getWidth();

    lines.reverse().forEach((line, index) => {
      const y = pageHeight - 10 - (index * lineHeight);
      doc.text(line, marginLeft, y);
    });

    let rawTexto = this.docDataString.texto;
    this.signedBy = this.docDataString.signedBy;

    if (!rawTexto) {
      this.commonService.showSnackBar('❌ No se encontró el texto del acto administrativo.');
      return;
    }

    /* Fechas formateadas */
    const formattedfecha_solicitud = formatDate(this.expediente.fecha_solicitud, 'dd/MM/yyyy HH:mm:ss', 'es-ES');
    const formattedFecha_not_req = formatDate(this.expediente.fecha_requerimiento_notif, 'dd/MM/yyyy', 'es-ES');
    const formattedFecha_REC_enmienda = formatDate(this.expediente.fecha_REC_enmienda, 'dd/MM/yyyy HH:mm:ss', 'es-ES');
    const formattedFecha_informe = formatDate(this.expediente.fecha_infor_fav_desf, 'dd/MM/yyyy', 'es-ES');
    const formattedFecha_pr_res_prov = formatDate(this.expediente.fecha_firma_propuesta_resolucion_prov, 'dd/MM/yyyy', 'es-ES');
    const formattedFecha_aval = formatDate(this.expediente.fecha_aval_idi_isba, 'dd/MM/yyyy', 'es-ES')
    const formattedFecha_BOIB = formatDate(this.fecha_BOIB, 'dd/MM/yyyy', 'es-ES');
    const formattedFecha_not_pr_res_prov = formatDate(this.expediente.fecha_not_propuesta_resolucion_prov, 'dd/MM/yyyy', 'es-ES');
    const formattedFecha_pr_res_def = formatDate(this.expediente.fecha_firma_propuesta_resolucion_def, 'dd/MM/yyyy', 'es-ES');
    const formattedFecha_not_pr_res_def = formatDate(this.expediente.fecha_not_propuesta_resolucion_def, 'dd/MM/yyyy', 'es-ES');

    /* Importes monetarios formateados */
    const formattedImporte_ayuda = this.commonService.formatCurrency(this.expediente.importe_ayuda_solicita_idi_isba);
    const formattedImporte_intereses = this.commonService.formatCurrency(this.expediente.intereses_ayuda_solicita_idi_isba);
    const formattedImporte_aval = this.commonService.formatCurrency(this.expediente.coste_aval_solicita_idi_isba);
    const formattedImporte_estudios = this.commonService.formatCurrency(this.expediente.gastos_aval_solicita_idi_isba);
    const formattedImporte_prestamo = this.commonService.formatCurrency(this.expediente.importe_prestamo);



    rawTexto = rawTexto.replace(/%SOLICITANTE%/g, this.actualEmpresa);
    rawTexto = rawTexto.replace(/%NIF%/g, this.actualNif);
    rawTexto = rawTexto.replace(/%FECHASOL%/g, formattedfecha_solicitud);
    rawTexto = rawTexto.replace(/%IMPORTEAYUDA%/g, formattedImporte_ayuda);
    rawTexto = rawTexto.replace(/%IMPORTE_INTERESES%/g, formattedImporte_intereses);
    rawTexto = rawTexto.replace(/%IMPORTE_AVAL%/g, formattedImporte_aval);
    rawTexto = rawTexto.replace(/%IMPORTE_ESTUDIO%/g, formattedImporte_estudios);
    rawTexto = rawTexto.replace(/%NOMBRE_BANCO%/g, this.expediente.nom_entidad);
    rawTexto = rawTexto.replace(/%IMPORTE_PRESTAMO%/g, formattedImporte_prestamo);
    rawTexto = rawTexto.replace(/%FECHAREQUERIMENT%/g, formattedFecha_not_req);
    rawTexto = rawTexto.replace(/%FECHAESMENA%/g, formattedFecha_REC_enmienda);
    rawTexto = rawTexto.replace(/%FECHAINFORME%/g, formattedFecha_informe);
    rawTexto = rawTexto.replace(/%FECHA_PROPUESTA_RESOLUCION_PROVISIONAL%/g, formattedFecha_pr_res_prov);
    rawTexto = rawTexto.replace(/%FECHA_AVAL%/g, formattedFecha_aval);
    rawTexto = rawTexto.replace(/%ANYOS_DURACION_AVAL%/g, this.expediente.plazo_aval_idi_isba);
    rawTexto = rawTexto.replace(/%FECHA_NOTIFICACION_PR_PROV%/g, formattedFecha_not_pr_res_prov);
    rawTexto = rawTexto.replace(/%FECHA_PROPUESTA_RESOLUCION_DEFINITIVA%/g, formattedFecha_pr_res_def);
    rawTexto = rawTexto.replace(/%FECHA_NOTIFICACION_P_RESOL_DEFINITIVA%/g, formattedFecha_not_pr_res_def);
    rawTexto = rawTexto.replace(/%BOIBFECHA%/g, formattedFecha_BOIB)
    rawTexto = rawTexto.replace(/%BOIBNUM%/g, this.num_BOIB);
    rawTexto = rawTexto.replace(/%DGERENTE%/g, this.dGerente);
    rawTexto = rawTexto.replace(/%NOMBREPRESIDENTEIDI%/g, this.nomPresidenteIdi);

    let jsonObject;

    // Limpieza de texto
    try {
      rawTexto = this.commonService.cleanRawText(rawTexto);
    } catch (error) {
      console.error('Error al parsear JSON: ', error);
    } finally {
      jsonObject = JSON.parse(rawTexto)
    }


    const maxCharsPerLine = 21;
    const maxTextWidth = 160;
    const x = marginLeft + 110;
    const y = 51;

    // Primera página
    doc.setFont('helvetica', 'bold');
    doc.addImage('../../../assets/images/logo-adrbalears-ceae-byn.png', 25, 20, 75, 15);
    doc.setFontSize(8);
    doc.text(doc.splitTextToSize("Document: resolució de concessió", maxTextWidth), x, 45);
    doc.text(`Núm. Expedient: ${this.actualIdExp}/${this.actualConvocatoria}`, x, 48);
    if (this.actualEmpresa.length > maxCharsPerLine) {
      const firstLine = this.actualEmpresa.slice(0, maxCharsPerLine);
      const secondLine = this.actualEmpresa.slice(maxCharsPerLine);
      doc.text(`Sol·licitant: ${firstLine}`, x, y);
      doc.text(secondLine, x, y + 3);
      doc.text(`NIF: ${this.actualNif}`, x, y + 6);
      doc.text("Emissor (DIR3): A04003714", x, y + 9);
      doc.text(`Codi SIA: ${this.codigoSIA}`, x, y + 12);
    } else {
      doc.text(`Sol·licitant: ${this.actualEmpresa}`, x, y);
      doc.text(`NIF: ${this.actualNif}`, x, 54);
      doc.text("Emissor (DIR3): A04003714", x, 57);
      doc.text(`Codi SIA: ${this.codigoSIA}`, x, 60);
    }

    doc.setFontSize(10);
    doc.text(doc.splitTextToSize(jsonObject.intro, maxTextWidth), marginLeft, 80);
    doc.text(doc.splitTextToSize(jsonObject.fets_tit, maxTextWidth), marginLeft, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(jsonObject.fets_1_2_3_4_5_6_7, maxTextWidth), marginLeft + 5, 110);

    // Segunda página
    doc.addPage();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    lines.forEach((line, index) => {
      const y = pageHeight - 10 - (index * lineHeight);
      doc.text(line, marginLeft, y);
    })
    doc.addImage("../../../assets/images/logoVertical.png", "PNG", 25, 20, 17, 22);

    doc.setFontSize(10);
    doc.text(doc.splitTextToSize(jsonObject.fets_8_9_10_11_12_13_14_15_16_17, maxTextWidth), marginLeft + 5, 60);

    // Tercera página
    doc.addPage();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    lines.forEach((line, index) => {
      const y = pageHeight - 10 - (index * lineHeight);
      doc.text(line, marginLeft, y);
    })
    doc.addImage("../../../assets/images/logoVertical.png", "PNG", 25, 20, 17, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(doc.splitTextToSize(jsonObject.fundamentosDeDerecho_tit, maxTextWidth), marginLeft, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(jsonObject.fundamentosDeDerechoTxt, maxTextWidth), marginLeft + 5, 70);

    // Cuarta página
    doc.addPage();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    lines.forEach((line, index) => {
      const y = pageHeight - 10 - (index * lineHeight);
      doc.text(line, marginLeft, y);
    })
    doc.addImage("../../../assets/images/logoVertical.png", "PNG", 25, 20, 17, 22);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(doc.splitTextToSize(jsonObject.dicto, maxTextWidth), marginLeft, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(jsonObject.resolucion_tit, maxTextWidth), marginLeft, 70);
    doc.text(doc.splitTextToSize(jsonObject.resolucion, maxTextWidth), marginLeft + 5, 80);

    // Quinta página
    doc.addPage();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    lines.forEach((line, index) => {
      const y = pageHeight - 10 - (index * lineHeight);
      doc.text(line, marginLeft, y);
    })
    doc.addImage("../../../assets/images/logoVertical.png", "PNG", 25, 20, 17, 22);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(doc.splitTextToSize(jsonObject.recursos_tit, maxTextWidth), marginLeft, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(jsonObject.recursos, maxTextWidth), marginLeft, 70);
    doc.text(doc.splitTextToSize(jsonObject.firma, maxTextWidth), marginLeft, 220);

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.text(`${i}/${totalPages}`, pageWidth - 20, pageHeight - 10);
    }

    // Convertir a Blob
    const pdfBlob = doc.output('blob');

    const formData = new FormData();
    const fileName = `${this.actualIdExp}_${this.actualConvocatoria}_${docFieldToUpdate}.pdf`;
    formData.append('file', pdfBlob, fileName);
    formData.append('id_sol', String(this.actualID));
    formData.append('convocatoria', String(this.actualConvocatoria));
    formData.append('nifcif_propietario', String(this.actualNif));
    formData.append('timeStamp', String(timeStamp));

    this.actoAdminService.sendPDFToBackEnd(formData).subscribe({
      next: (response) => {
        this.docGeneradoInsert.id_sol = this.actualID;
        this.docGeneradoInsert.cifnif_propietario = this.actualNif;
        this.docGeneradoInsert.convocatoria = String(this.actualConvocatoria);
        this.docGeneradoInsert.name = `doc_${docFieldToUpdate}.pdf`;
        this.docGeneradoInsert.type = 'application/pdf';
        this.docGeneradoInsert.created_at = response.path;
        this.docGeneradoInsert.tipo_tramite = this.actualTipoTramite;
        this.docGeneradoInsert.corresponde_documento = `doc_${docFieldToUpdate}`;
        this.docGeneradoInsert.selloDeTiempo = timeStamp;

        this.nameDocGenerado = `doc_${docFieldToUpdate}.pdf`;

        this.documentosGeneradosService.deleteByIdSolNifConvoTipoDoc(this.actualID, this.actualNif, this.actualConvocatoria, 'doc_res_concesion_con_requerimiento_adr_isba')
          .subscribe({
            next: () => {
              this.insertDocumentoGenerado(docFieldToUpdate);
            },
            error: (deleteErr) => {
              const status = deleteErr?.status;
              const msg = deleteErr?.error?.message || '';
              // Si es "no encontrado" (por ejemplo, 404) seguimos el flujo normal
              if (status === 404 || msg.includes('no se encontró') || msg.includes('No existe')) {
                this.commonService.showSnackBar('ℹ️ No había documento previo que eliminar.');
                this.insertDocumentoGenerado(docFieldToUpdate);
              } else {
                // Otros errores sí se notifican y no continúan
                const deleteErrMsg = msg || '❌ Error al eliminar el documento previo.';
                this.commonService.showSnackBar(deleteErrMsg);
              }
            }
          });
      }
    });
  }

  insertDocumentoGenerado(docFieldToUpdate: string): void {
    this.documentosGeneradosService.create(this.docGeneradoInsert).subscribe({
      next: (resp: any) => {
        this.lastInsertId = resp?.id;
        if (this.lastInsertId) {
          this.expedienteService
            .updateFieldExpediente(this.actualID, `doc_${docFieldToUpdate}`, String(this.lastInsertId))
            .subscribe({
              next: (response: any) => {
                const mensaje =
                  response?.message || `✅ Resolución de Concesión con requerimiento generado automáticamente`;
                this.commonService.showSnackBar(mensaje);
                this.sendActoAdminToSign(this.actualNif, this.nameDocGenerado);
              },
              error: (updateErr) => {
                const updateErrorMsg =
                  updateErr?.error?.message ||
                  '⚠️ Ha habido un error intentando generar automáticamente la Resolución de Concesión con requerimiento.';
                this.commonService.showSnackBar(updateErrorMsg);
              }
            })
        } else {
          this.commonService.showSnackBar(
            '⚠️ Documento generado, pero no se recibió el ID para actualizar el expediente.'
          );
        }
      },
      error: (insertErr) => {
        const insertErrorMsg =
          insertErr?.error?.message ||
          '❌ Error al guardar la Resolución de Concesión con requerimiento';
        this.commonService.showSnackBar(insertErrorMsg);
      }
    });
  }

  sendActoAdminToSign(nif: string, filename: string): void {
    filename = filename.replace(/^doc_/, "");
    filename = `${this.actualIdExp}_${this.actualConvocatoria}_${filename}`;

    let email: string = "";

    switch (this.signedBy) {
      case 'technician':
        email = this.technicianEmail;
        break;
      case 'ceo':
        email = this.ceoEmail;
        break;

      case 'conseller':
        // ToDo
        email = this.consellerEmail;
        break;

    }

    const payload: CreateSignatureRequest = {
      adreca_mail: email,
      nombreDocumento: filename,
      nif: nif,
      last_insert_id: this.lastInsertId
    };

    this.viafirmaService.createSignatureRequest(payload)
      .pipe(finalize(() => { }))
      .subscribe({
        next: (res) => {
          const id = res?.publicAccessId;
          this.commonService.showSnackBar(id ? `Solicitud de firma creada. ID: ${id} y enviada a la dirección: ${payload.adreca_mail} para Resolución de Concesión con requerimiento` : 'Solicitud de firma creada correctamente');
          this.endNotification(); // Para devolver el subject
        },
        error: (err) => {
          const msg = err?.error?.message || err?.message || 'No se pudo enviar la solicitud de firma';
          this.commonService.showSnackBar(msg);
        }
      })
  }

  private endNotification(): void {
    this.flujoTerminadoSubject.next(true);
  }
}
