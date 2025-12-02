import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';
import { ActoAdministrativoService } from '../acto-administrativo.service';
import { CommonService } from '../common.service';
import { MejorasSolicitudService } from '../mejoras-solicitud.service';
import { DocumentosGeneradosService } from '../documentos-generados.service';
import { ExpedienteService } from '../expediente.service';
import { PindustLineaAyudaDTO } from '../../Models/linea-ayuda-dto';
import { DocumentoGeneradoDTO } from '../../Models/documentos-generados-dto';
import { MejoraSolicitudDTO } from '../../Models/mejoras-solicitud-dto';
import { ConfigurationModelDTO } from '../../Models/configuration.dto';
import jsPDF from 'jspdf';

@Injectable({
  providedIn: 'root'
})
export class PrDevinitivaDESFavorable_ConReqService {
    private expedienteService = inject(ExpedienteService)
    private signedBy: string = ""
    private num_BOIB: string = ""
    private fecha_BOIB: string = ""
    private codigoSIA: string = ""
  
    private docGeneradoInsert: DocumentoGeneradoDTO = {
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
    }
    private lastInsertId: number | undefined
  
    constructor( private actoAdminService: ActoAdministrativoService, 
        private commonService: CommonService, private mejorasSolicitudService: MejorasSolicitudService, 
        private documentosGeneradosService: DocumentosGeneradosService ) { }
  
     generateActoAdmin(actualID: number, actualNif: string, actualConvocatoria: number, actoAdministrivoName: string, lineaAyuda: string, tipoTramite: string,
        docFieldToUpdate: string, fecha_solicitud: string, fecha_firma_propuesta_resolucion_prov: string, fecha_not_propuesta_resolucion_prov: string,
        fecha_infor_fav_desf: string, motivoDenegacion:string, actualIdExp: number, actualEmpresa: string, 
        actualImporteSolicitud: number, fecha_requerimiento: string, fecha_REC_enmienda: string ): Observable<boolean> {
       
      // Obtengo, desde bbdd, el template json del acto adiministrativo y para la línea: XECS
       return this.actoAdminService.getByNameAndTipoTramite(actoAdministrivoName, lineaAyuda).pipe(
         switchMap((docDataString: any) => {
           let hayMejoras = 0;
           let rawTexto = docDataString.texto;
           this.signedBy = docDataString.signedBy;
           let jsonObject: any;
           if (!rawTexto) {
             this.commonService.showSnackBar('❌ No se encontró el texto del acto administrativo.');
             return of(false);
           }
           // Voy a crear el Texto que luego servirá para generar el archivo PDF
           // Reemplazo las variables que hay en el template por su valor correspondiente
           this.actoAdminService.getLineDetail(actualConvocatoria)
             .subscribe((lineaAyudaItems: PindustLineaAyudaDTO) => {
               this.codigoSIA = lineaAyudaItems['codigoSIA'];
               rawTexto = rawTexto.replace(/%BOIBFECHA%/g, this.commonService.formatDate(lineaAyudaItems['fecha_BOIB'], true));
               rawTexto = rawTexto.replace(/%BOIBNUM%/g, lineaAyudaItems['num_BOIB']);
               rawTexto = rawTexto.replace(/%FECHARESPRESIDI%/g, this.commonService.formatDate(lineaAyudaItems['fechaResPresidIDI'] ?? '', true));
             });
  
           rawTexto = rawTexto.replace(/%NIF%/g, actualNif);
           rawTexto = rawTexto.replace(/%SOLICITANTE%/g, actualEmpresa);
           rawTexto = rawTexto.replace(/%EXPEDIENTE%/g, String(actualIdExp));
           rawTexto = rawTexto.replace(/%CONVO%/g, String(actualConvocatoria));
           rawTexto = rawTexto.replace(/%FECHASOL%/g, this.commonService.formatDate(fecha_solicitud));
           rawTexto = rawTexto.replace(/%IMPORTE%/g, this.commonService.formatCurrency(actualImporteSolicitud));
           rawTexto = rawTexto.replace(/%PROGRAMA%/g, tipoTramite);
  
           rawTexto = rawTexto.replace(/%FECHA_FIRMA_INFORME%/g, this.commonService.formatDate(fecha_infor_fav_desf))
           rawTexto = rawTexto.replace(/%TEXTOLIBRE%/g, motivoDenegacion)
           rawTexto = rawTexto.replace(/%FECHAPRPROVISIONAL%/g, this.commonService.formatDate(fecha_firma_propuesta_resolucion_prov))
           rawTexto = rawTexto.replace(/%FECHANOTIPRPROVISIONAL%/g, this.commonService.formatDate(fecha_not_propuesta_resolucion_prov))

           rawTexto = rawTexto.replace(/%FECHAREQUERIMENT%/g, this.commonService.formatDate(fecha_requerimiento))
           rawTexto = rawTexto.replace(/%FECHA_REC_ENMIENDA%/g, this.commonService.formatDate(fecha_REC_enmienda))

           this.actoAdminService.getGlobalConfig()
             .subscribe((globalConfig: ConfigurationModelDTO) => {
               rawTexto = rawTexto.replace(/%DGERENTE%/g, globalConfig?.directorGerenteIDI ?? '');
             });
  
           // Averiguo si hay mejoras en la solicitud
           return this.mejorasSolicitudService.countMejorasSolicitud(actualID)
             .pipe(
               switchMap((nMejoras: any) => {
                 if (nMejoras.total_mejoras > 0) {
                   hayMejoras = nMejoras.total_mejoras;
                   return this.mejorasSolicitudService.obtenerUltimaMejoraSolicitud(actualID).pipe(
                     tap((ultimaMejora: MejoraSolicitudDTO) => {
                       rawTexto = rawTexto.replace(/%FECHARECM%/g, this.commonService.formatDate(String(ultimaMejora.fecha_rec_mejora)));
                       rawTexto = rawTexto.replace(/%NUMRECM%/g, String(ultimaMejora.ref_rec_mejora));
                       rawTexto = rawTexto.replace(/%XXX%/g, String("5. "));
                       rawTexto = rawTexto.replace(/%YYY%/g, String("6. "));
                       rawTexto = rawTexto.replace(/%ZZZ%/g, String("7. "));
                       rawTexto = rawTexto.replace(/%AAA%/g, String("8. "));
                       rawTexto = rawTexto.replace(/%BBB%/g, String("9. "));
                     })
                   );
                 } else {
                   rawTexto = rawTexto.replace(/%XXX%/g, String("4. "));
                   rawTexto = rawTexto.replace(/%YYY%/g, String("5. "));
                   rawTexto = rawTexto.replace(/%ZZZ%/g, String("6. "));
                   rawTexto = rawTexto.replace(/%AAA%/g, String("7. "));
                   rawTexto = rawTexto.replace(/%BBB%/g, String("8. "));
                   return of(null);
                 }
                 
               }),
               tap(() => {
                 try {
                   rawTexto = this.commonService.cleanRawText(rawTexto); /* quito saltos de línea introducidos con el INTRO */
                   jsonObject = JSON.parse(rawTexto);
                   this.generarPDF(actualID, actualNif, actualConvocatoria, tipoTramite, jsonObject, docFieldToUpdate, hayMejoras, actualIdExp, actualEmpresa);
                 } catch (error) {
                   console.error('Error al parsear JSON:', error);
                 }
               }),
               map(() => true)
             );
         }),
         catchError((err) => {
           console.error(err);
           return of(false);
         })
       );
      }
   
     generarPDF(actualID: number, actualNif: string, actualConvocatoria: number, tipoTramite: string, jsonObject: any, 
      docFieldToUpdate: string, hayMejoras: number, actualIdExp: number, actualEmpresa: string): void {
  
       const timeStamp = this.commonService.generateCustomTimestamp()
       const doc = new jsPDF({
         orientation: 'p',
         unit: 'mm',
         format: 'a4',
         putOnlyUsedFonts: true,
         floatPrecision: 16
       });
   
       doc.setProperties({
         title: `${actualIdExp + '_' + actualConvocatoria + '_' + docFieldToUpdate}`,
         subject: 'Tràmits administratius',
         author: 'ADRBalears',
         keywords: 'ayudas, subvenciones, xecs, ils, adr-isba',
         creator: 'Angular App'
       });
   
       const footerText = 'Plaça de Son Castelló, 1\n07009 Polígon de Son Castelló - Palma\nTel. 971 17 61 61\nwww.adrbalears.es';
       doc.setFont('helvetica', 'normal');
       doc.setFontSize(8);
       
       const maxCharsPerLine = 21;
       const marginLeft = 25;
       const maxTextWidth = 160;
       const lineHeight = 4;
       const pageHeight = doc.internal.pageSize.getHeight();
       let lines = footerText.split('\n');
       const xHeader = marginLeft + 109
       const yHeader = 58;
       const pageWidth = doc.internal.pageSize.getWidth();
       
       lines.reverse().forEach((line, index) => {
         const y = pageHeight - 10 - (index * lineHeight);
         doc.text(line, marginLeft, y);
       });
   
       doc.setFont('helvetica', 'normal');
       doc.addImage("../../../assets/images/logo-adrbalears-ceae-byn.png", "PNG", 25, 20, 75, 15);
       doc.setFontSize(8);
       doc.text("Document: proposta de resolució definitiva", xHeader, 45);
       doc.text(`Núm. Expedient: ${actualIdExp}/${actualConvocatoria}`, xHeader, 52);
       doc.text(`Programa: ${doc.splitTextToSize(tipoTramite, maxTextWidth)}`, xHeader, 55);
   
       if (actualEmpresa.length > maxCharsPerLine) {
         const firstLine = actualEmpresa.slice(0, maxCharsPerLine);
         const secondLine = actualEmpresa.slice(maxCharsPerLine).replace(/^\s+/, '');
         doc.text(`Sol·licitant: ${firstLine}`, xHeader, yHeader);
         doc.text(secondLine, xHeader, yHeader + 3);
         doc.text(`NIF: ${actualNif}`, xHeader, yHeader + 6);
         doc.text("Emissor (DIR3): A04003714", xHeader, yHeader + 9);
         doc.text(`Codi SIA: ${this.codigoSIA}`, xHeader, yHeader + 12);
       } else {
         doc.text(`Sol·licitant: ${actualEmpresa}`, xHeader, yHeader);
         doc.text(`NIF: ${actualNif}`, xHeader, yHeader + 3);
         doc.text("Emissor (DIR3): A04003714", xHeader, yHeader + 6);
         doc.text(`Codi SIA: ${this.codigoSIA}`, xHeader, yHeader + 9);
       }
   
       doc.setFontSize(10);
       doc.setFont('helvetica', 'bold');    
       doc.text(doc.splitTextToSize(jsonObject.intro, maxTextWidth), marginLeft, 90);
       doc.text(doc.splitTextToSize(jsonObject.antecedentes_tit, maxTextWidth), marginLeft, 130);
       doc.setFont('helvetica', 'normal');
       doc.text(doc.splitTextToSize(jsonObject.antecedentes_1_3, maxTextWidth), marginLeft + 5, 140);
       if (hayMejoras > 0) {
         doc.text(doc.splitTextToSize(jsonObject.antecedentes_4_m, maxTextWidth), marginLeft + 5, 211);
       }
   
       // Salto de página
       doc.addPage();
       doc.setFont('helvetica', 'normal');
       doc.setFontSize(8);
       doc.addImage("../../../assets/images/logoVertical.png", "PNG", 25, 20, 17, 22);
       lines = footerText.split('\n');
       lines.reverse().forEach((line, index) => {
         const y = pageHeight - 10 - (index * lineHeight);
         doc.text(line, marginLeft, y);
       });
       doc.setFontSize(10);
       doc.text(doc.splitTextToSize(jsonObject.antecedentes_5_9, maxTextWidth), marginLeft + 5 , 60);
   
       // Salto de página
       doc.addPage();
       doc.setFont('helvetica', 'normal');
       doc.setFontSize(8);
       doc.addImage("../../../assets/images/logoVertical.png", "PNG", 25, 20, 17, 22);
       lines = footerText.split('\n');
       lines.reverse().forEach((line, index) => {
         const y = pageHeight - 10 - (index * lineHeight);
         doc.text(line, marginLeft, y);
       });
       doc.setFontSize(10);    
       doc.setFont('helvetica', 'bold');
       doc.text(doc.splitTextToSize(jsonObject.fundamentos_tit, maxTextWidth), marginLeft, 60);
       doc.setFont('helvetica', 'normal');
       doc.text(doc.splitTextToSize(jsonObject.fundamentos_txt, maxTextWidth), marginLeft + 5, 70);
   
       // Salto de página
       doc.addPage();
       doc.setFont('helvetica', 'normal');
       doc.setFontSize(8);
       doc.addImage("../../../assets/images/logoVertical.png", "PNG", 25, 20, 17, 22);
       lines = footerText.split('\n');
       lines.reverse().forEach((line, index) => {
         const y = pageHeight - 10 - (index * lineHeight);
         doc.text(line, marginLeft, y);
       });
       doc.setFontSize(10);
       doc.setFont('helvetica', 'bold');
       doc.text(doc.splitTextToSize(jsonObject.propuesta_tit, maxTextWidth), marginLeft, 60); 
       doc.setFont('helvetica', 'normal');
       doc.text(doc.splitTextToSize(jsonObject.propuesta_cab, maxTextWidth), marginLeft, 70);
       doc.text(doc.splitTextToSize(jsonObject.propuesta_txt, maxTextWidth), marginLeft + 5, 80);
    
       doc.text(doc.splitTextToSize(jsonObject.firma, maxTextWidth), marginLeft, 240);
   
       const totalPages = doc.getNumberOfPages();
       for (let i = 1; i <= totalPages; i++) {
         doc.setPage(i);
         doc.text(`${i}/${totalPages}`, pageWidth - 20, pageHeight - 10);
       }
   
       // además de generar el pdf del acto administrativo hay que enviarlo al backend
       // Convertir a Blob
       const pdfBlob = doc.output('blob');
   
       // Crear FormData
       const formData = new FormData();
       const fileName = `${actualIdExp + '_' + actualConvocatoria + '_prop_res_def_desfavorable_con_req.pdf'}`;
       formData.append('file', pdfBlob, fileName);
       formData.append('id_sol', String(actualID));
       formData.append('convocatoria', String(actualConvocatoria));
       formData.append('nifcif_propietario', String(actualNif));
       formData.append('timeStamp', String(timeStamp));
   
       // Enviar al backend usando el servicio
       this.actoAdminService.sendPDFToBackEnd(formData).subscribe({
         next: (response) => {
           // ToDo: al haberse generado con éxito, ahora hay que:
           // Hacer un INSERT en la tabla pindust_documentos_generados y recoger el id asignado al registro creado: 'last_insert_id'. 
           // y antes eliminar los documentos generados para evitar duplicados.
           this.docGeneradoInsert.id_sol = actualID
           this.docGeneradoInsert.cifnif_propietario = actualNif
           this.docGeneradoInsert.convocatoria = String(actualConvocatoria)
           this.docGeneradoInsert.name = 'doc_prop_res_def_desfavorable_con_req.pdf'
           this.docGeneradoInsert.type = 'application/pdf'
           this.docGeneradoInsert.created_at = response.path
           this.docGeneradoInsert.tipo_tramite = tipoTramite
           this.docGeneradoInsert.corresponde_documento = `${docFieldToUpdate}`
           this.docGeneradoInsert.selloDeTiempo = timeStamp
  
           // delete documentos generados antes del insert para evitar duplicados
           this.documentosGeneradosService.deleteByIdSolNifConvoTipoDoc( actualID, actualNif, actualConvocatoria, docFieldToUpdate)
             .subscribe({
               next: () => {
                 // Eliminado correctamente, o no había nada que eliminar
                 this.InsertDocumentoGenerado(actualID, docFieldToUpdate);
               },
               error: (deleteErr) => {
                 const status = deleteErr?.status;
                 const msg = deleteErr?.error?.message || '';
                 // Si es "no encontrado" (por ejemplo, 404) seguimos el flujo normal
                 if (status === 404 || msg.includes('no se encontró') || msg.includes('No existe')) {
                   this.commonService.showSnackBar('ℹ️ No había documento previo que eliminar.');
                   this.InsertDocumentoGenerado(actualID, docFieldToUpdate);
                 } else {
                 // Otros errores sí se notifican y no continúan
                   const deleteErrMsg = msg || '❌ Error al eliminar el documento previo.';
                   this.commonService.showSnackBar(deleteErrMsg);
                 }
               }
             });
           },
           error: (err) => {
           const errorMsg = err?.error?.message || '❌ Error al guardar el Acto administrativo.';
           this.commonService.showSnackBar(errorMsg);
           }
       });   
     }
   
     // Método auxiliar para no repetir el bloque de creación
     InsertDocumentoGenerado(actualID: number, docFieldToUpdate: string): void {
     this.documentosGeneradosService.create(this.docGeneradoInsert).subscribe({
       next: (resp: any) => {
         this.lastInsertId = resp?.id;
         if (this.lastInsertId) {
           this.expedienteService
             .updateFieldExpediente( actualID, docFieldToUpdate, String(this.lastInsertId) )
             .subscribe({
               next: (response: any) => {
                 const mensaje =
                   response?.message ||
                   '✅ Acto administrativo generado y expediente actualizado correctamente.';
                  this.commonService.showSnackBar(mensaje);
                  return true;
               },
               error: (updateErr) => {
                 const updateErrorMsg =
                   updateErr?.error?.message ||
                   '⚠️ Documento generado, pero error al actualizar el expediente.';
                 this.commonService.showSnackBar(updateErrorMsg);
               }
             });
         } else {
           this.commonService.showSnackBar(
             '⚠️ Documento generado, pero no se recibió el ID para actualizar el expediente.'
           );
         }
       },
       error: (insertErr) => {
         const insertErrorMsg =
           insertErr?.error?.message ||
           '❌ Error al guardar el documento generado.';
         this.commonService.showSnackBar(insertErrorMsg);
       }
     });
     }
}
