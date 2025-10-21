import { ChangeDetectionStrategy, Component, OnInit, viewChild, signal, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormControl, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { map, Observable, of, startWith, throwError } from 'rxjs';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule, MatAccordion } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialog, MatDialogConfig, MatDialogModule } from '@angular/material/dialog';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { PopUpDialogComponent } from '../../popup-dialog/popup-dialog.component';
import { TranslateModule } from '@ngx-translate/core';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { ZipCodesIBDTO } from '../../Models/zip-codes-ib.dto';
import { CommonService } from '../../Services/common.service';
import { DocumentService } from '../../Services/document.service';
import { NifValidatorService } from '../../Services/nif-validator-service';
import { CnaeDTO } from '../../Models/cnae.dto';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { from } from 'rxjs';
import { catchError, concatMap, last, tap } from 'rxjs/operators';
import { XecsProgramsDTO } from '../../Models/xecs-programs-dto';
import { AuthorizationTextDTO } from '../../Models/authorization-texts-dto';
import { ResponsabilityDeclarationDTO } from '../../Models/responsability-declaration-dto';
import { ExpedienteService } from '../../Services/expediente.service';
import { ExpedienteDocumentoService } from '../../Services/expediente.documento.service';
import { PindustLineaAyudaDTO } from '../../Models/linea-ayuda-dto';
import { PindustLineaAyudaService } from '../../Services/linea-ayuda.service';
import { TranslateService } from '@ngx-translate/core';
import { CreateSignatureRequest } from '../../Models/signature.dto';
import { ViafirmaService } from '../../Services/viafirma.service';
import { ActoAdministrativoService } from '../../Services/acto-administrativo.service';
import jsPDF from 'jspdf';
import { ActoAdministrativoDTO } from '../../Models/acto-administrativo-dto';
import { DocumentoGeneradoDTO } from '../../Models/documentos-generados-dto';
import { DocumentosGeneradosService } from '../../Services/documentos-generados.service';

@Component({
  selector: 'app-grant-application-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatSelectModule, MatExpansionModule, MatAutocompleteModule,
    MatAccordion, MatIconModule, MatDatepickerModule, MatCheckboxModule, MatRadioModule, MatDialogModule, TranslateModule, MatProgressBarModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
  templateUrl: './grant-application-form.component.html',
  styleUrl: './grant-application-form.component.scss',
})

export class GrantApplicationFormComponent implements OnInit {
  @Output() noHeader = new EventEmitter<boolean>();
  readonly dialog = inject(MatDialog)
  htmlContentRequiredDocs: string = ''
  step = signal(0)
  uploadProgress: number = 0
  xecsForm: FormGroup
  accordion = viewChild.required(MatAccordion)
  rgpdAccepted: boolean = false
  documentoYaEnADR: boolean = false
  introText: string = "getting intro text..."
  filteredcpostals: Observable<ZipCodesIBDTO[]> | undefined
  cpostals: ZipCodesIBDTO[] = []
  cnaes: CnaeDTO[] = []
  xecsPrograms: XecsProgramsDTO[] = []
  responsibilityDeclarations: ResponsabilityDeclarationDTO[] = []
  authorizations: AuthorizationTextDTO[] = []
  filesToUploadOptional: string[] = []  // new
  lastID: number = 0
  lineDetail: PindustLineaAyudaDTO[] = []
  num_BOIB: string = ""
  codigoSIA: string = ""
  convoData!: string
  declaracion_enviada: boolean = false;
  nameDocGenerado!: string;
  convocatoria?: number

  docGenerado: DocumentoGeneradoDTO = {
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
  lastInsertId!: number;

  consentimiento_copiaNIF!: boolean;
  consentimiento_certificadoSegSoc!: boolean;
  consentimiento_certificadoATIB!: boolean;

  constructor(private fb: FormBuilder, private documentoGeneradoService: DocumentosGeneradosService,
    private commonService: CommonService, private actoAdminService: ActoAdministrativoService,
    private expedienteService: ExpedienteService, private viafirmaService: ViafirmaService,
    private documentosExpedienteService: ExpedienteDocumentoService, private translate: TranslateService,
    private documentService: DocumentService, private lineaAyuda: PindustLineaAyudaService,
    private nifValidator: NifValidatorService
  ) {

    this.xecsForm = this.fb.group({
      id_sol: this.fb.control(0),
      idExp: this.fb.control(0),
      selloDeTiempo: this.fb.control(''),
      opc_programa: this.fb.array([]),
      nif: this.fb.control({ value: '', disabled: true }, [Validators.required]),
      empresa: this.fb.control('', [Validators.required]),
      domicilio: this.fb.control({ value: '', disabled: false }, [Validators.required]),
      cpostal: this.fb.control('', [Validators.pattern('^07[0-9]{3}$')]),
      localidad: this.fb.control({ value: '', disabled: true }, [Validators.required]),
      iae: this.fb.control({ value: '', disabled: false }, [Validators.required]),
      telefono: this.fb.control('', [Validators.pattern('^[0-9]{9}$')]),
      acceptRGPD: this.fb.control<boolean | null>(false, Validators.required),
      tipo_tramite: this.fb.control<string | null>('', Validators.required),
      tipo_solicitante: this.fb.control<string | null>('', Validators.required),
      nom_representante: this.fb.control<string | null>({ value: '', disabled: true }),
      nif_representante: this.fb.control<string | null>({ value: '', disabled: true }, [Validators.pattern('^[0-9]+[A-Za-z]$')]),
      telefono_rep: this.fb.control<string | null>('', [Validators.pattern('^[0-9]{9}$')]),
      email_rep: this.fb.control<string | null>('', [Validators.email]),
      empresa_consultor: this.fb.control<string | null>(''),
      nom_consultor: this.fb.control<string | null>(''),
      tel_consultor: this.fb.control<string | null>('', Validators.pattern('^[0-9]{9}$')),
      mail_consultor: this.fb.control<string | null>('', Validators.email),
      fecha_completado: this.fb.control(this.commonService.getCurrentDateTime()),

      memoriaTecnicaEnIDI: this.fb.control<boolean | null>(false, Validators.required),
      file_memoriaTecnica: this.fb.control<File | null>(null, Validators.required),
      file_certificadoIAE: this.fb.control<File | null>(null, Validators.required),
      file_nifEmpresa: this.fb.control<File | null>(null, Validators.required),
      pJuridicaDocAcreditativaEnIDI: this.fb.control<boolean | null>(false, Validators.required),
      file_escritura_empresa: this.fb.control<File | null>(null, Validators.required),

      file_document_acred_como_repres: this.fb.control<File | null>(null, Validators.required),
      file_certificadoAEAT: this.fb.control<File | null>(null, Validators.required),
      copiaNIFSociedadEnIDI: this.fb.control<boolean | null>(false, Validators.required),
      /* AUTORIZACIONES */
      consentimientocopiaNIF: this.fb.control<boolean | null>(true, Validators.required),  /* SI NO file_copiaNIF de la tabla pindust_expediente */
      file_copiaNIF: this.fb.control<File | null>(null),
      consentimiento_certificadoATIB: this.fb.control<boolean | null>(true, Validators.required),  /* SI NO file_certificadoATIB de la tabla pindust_expediente*/
      file_certificadoATIB: this.fb.control<File | null>(null),
      consentimiento_certificadoSegSoc: this.fb.control<boolean | null>(true, Validators.required), /* SI NO file_certificadoSegSoc de la tabla pindust_expediente*/
      file_certificadoSegSoc: this.fb.control<File | null>(null),

      nom_entidad: this.fb.control<string | null>('',),
      domicilio_sucursal: this.fb.control<string | null>('',),
      codigo_BIC_SWIFT: this.fb.control<string | null>('', [Validators.minLength(11), Validators.maxLength(11), Validators.pattern(/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/)]),
      opcion_banco: this.fb.control<string | null>('',),
      cc_datos_bancarios: this.fb.control<string | null>({ value: '', disabled: true }, [Validators.minLength(24), Validators.maxLength(25), Validators.pattern(/^\S*$/)]),

      declaracion_responsable_i: this.fb.control<boolean | null>({ value: true, disabled: true }),
      declaracion_responsable_ii: this.fb.control<boolean | null>({ value: false, disabled: false }),
      importe_minimis: this.fb.control<string | null>('', [Validators.required, this.twoDecimalValidator()]),
      declaracion_responsable_iv: this.fb.control<boolean | null>({ value: true, disabled: true }),
      declaracion_responsable_v: this.fb.control<boolean | null>({ value: true, disabled: true }),
      declaracion_responsable_vi: this.fb.control<boolean | null>({ value: true, disabled: true }),
      declaracion_responsable_vii: this.fb.control<boolean | null>({ value: true, disabled: true }),
      declaracion_responsable_viii: this.fb.control<boolean | null>({ value: true, disabled: true }),
      declaracion_responsable_ix: this.fb.control<boolean | null>({ value: true, disabled: true }),
      declaracion_responsable_x: this.fb.control<boolean | null>({ value: true, disabled: true }),
      declaracion_responsable_xi: this.fb.control<boolean | null>({ value: true, disabled: true }),
    });
  }

  ngOnInit(): void {
    this.noHeader.emit(true);

    this.xecsForm.get('acceptRGPD')?.valueChanges.subscribe((value: boolean) => {
      this.rgpdAccepted = value;
    });

    this.filteredcpostals = this.xecsForm.get('cpostal')!.valueChanges.pipe(
      startWith(''),
      map(value => {
        const input = typeof value === 'string' ? value : value?.cpostal || '';
        return input ? this._filter(input) : this.cpostals.slice();
      })
    );

    const nifControl = this.xecsForm.get('nif')
    const nom_representanteControl = this.xecsForm.get('nom_representante')
    const nif_representanteControl = this.xecsForm.get('nif_representante')
    const opcionBancoControl = this.xecsForm.get('opcion_banco')
    const ccControl = this.xecsForm.get('cc_datos_bancarios')
    const codigo_BIC_SWIFTControl = this.xecsForm.get('codigo_BIC_SWIFT')

    opcionBancoControl?.valueChanges.subscribe((valor) => {

      ccControl?.enable()
      ccControl?.setValue(''); // Limpia el campo al cambiar de opción

      if (valor === '1') {
        // Patrón para IBAN español (por ejemplo: empieza por ES y 22 dígitos)
        ccControl?.setValidators([
          Validators.required,
          Validators.minLength(24),
          Validators.maxLength(24),
          Validators.pattern(/^ES\d{22}$/)
        ]);

        ccControl?.valueChanges.subscribe((inputValue: string) => {
          if (inputValue && !inputValue.startsWith('ES')) {
            ccControl?.setValue(inputValue.toUpperCase(), { emitEvent: false });
          }
        });
      } else if (valor === '2') {
        // Patrón para cuentas internacionales (ejemplo genérico sin espacios)
        ccControl?.setValidators([
          Validators.required,
          Validators.minLength(25),
          Validators.maxLength(25),
          Validators.pattern(/^\S+$/)
        ]);
      }
      ccControl?.updateValueAndValidity();
    });

    nifControl?.valueChanges.subscribe((valor) => {
      nifControl.setValue(valor.toUpperCase(), { emitEvent: false });
    })

    nif_representanteControl?.valueChanges.subscribe((valor) => {
      nif_representanteControl.setValue(valor.toUpperCase(), { emitEvent: false });
    })

    ccControl?.valueChanges.subscribe((valor) => {
      if (opcionBancoControl?.value === '1' && valor !== valor?.toUpperCase()) {
        ccControl.setValue(valor.toUpperCase(), { emitEvent: false });
      }
    });

    codigo_BIC_SWIFTControl?.valueChanges.subscribe((valor) => {
      codigo_BIC_SWIFTControl.setValue(valor.toUpperCase(), { emitEvent: false });
    });


    this.xecsForm.get('tipo_solicitante')?.valueChanges.subscribe(value => {
      nifControl?.enable()

      if (!nifControl) return;

      // Limpia validadores anteriores
      nifControl.clearValidators();

      if (value === 'autonomo') {
        nifControl.setValidators([
          Validators.required,
          Validators.minLength(9),
          Validators.maxLength(9),
          this.nifValidator.validateDniNie()
        ]);
        nom_representanteControl?.disable()
        nif_representanteControl?.disable()
      } else {
        nifControl.setValidators([
          Validators.required,
          Validators.minLength(9),
          Validators.maxLength(9),
          this.nifValidator.validateCif()
        ]);
        nom_representanteControl?.enable()
        nif_representanteControl?.enable()
      }

      nifControl.updateValueAndValidity();
    });

    this.getAllcpostals()
    this.getAllCnaes()
    this.getAllXecsPrograms()
    this.getResponsabilityDeclarations()
    this.getDocumentationAndAuthorizations()
    this.getLineDetail(2026)
  }

  setStep(index: number) {
    this.step.set(index);
  }

  get placeholderNif(): string {
    const tipo = this.xecsForm.get('tipo_solicitante')?.value;
    if (tipo === 'autonomo') {
      return 'Introduzca su DNI o NIE';
    } else if (tipo === 'pequenya' || tipo === 'mediana') {
      return 'Introduzca el CIF de la empresa';
    }
    return "Seleccione el 'Tipo de solicitante' y, luego, introduzca el NIF";
  }

  twoDecimalValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      const regex = /^\d+([.,]\d{2})$/;
      return value && !regex.test(value) ? { invalidDecimal: true } : null;
    };
  }

  file_memoriaTecnicaToUpload: File[] = []              // REQUIRED and maybe in ADR
  file_certificadoIAEToUpload: File[] = []              // REQUIRED
  file_nifEmpresaToUpload: File[] = []                  // REQUIRED and maybe in ADR
  file_escritura_empresaToUpload: File[] = []           // REQUIRED and maybe in ADR
  file_document_acred_como_represToUpload: File[] = []  // REQUIRED
  file_certificadoAEATToUpload: File[] = []             // REQUIRED

  file_copiaNIFToUpload: File[] = []                    // OPC
  file_certificadoATIBToUpload: File[] = []             // OPC
  file_certificadoSegSocToUpload: File[] = []           // OPC

  onSubmit(): void {
    const datos = this.xecsForm.getRawValue();
    const timeStamp = this.commonService.generateCustomTimestamp();
    const convocatoria = new Date().getFullYear();

    this.expedienteService.getLastExpedienteIdXECS(convocatoria).subscribe((lastID: any) => {
      datos.idExp = (+lastID.last_id) + 1
      datos.convocatoria = convocatoria
      // datos.localidad = datos.cpostal
      datos.selloDeTiempo = timeStamp
      datos.tipo_tramite = datos.tipo_tramite.replace(/_/g, ' ')
      datos.file_copiaNIF = datos.consentimientocopiaNIF
      datos.file_certificadoATIB = datos.consentimiento_certificadoATIB
      datos.file_certificadoSegSoc = datos.consentimiento_certificadoSegSoc

      this.consentimiento_copiaNIF = datos.consentimientocopiaNIF
      this.consentimiento_certificadoATIB = datos.consentimiento_certificadoATIB
      this.consentimiento_certificadoSegSoc = datos.consentimiento_certificadoSegSoc

      // Eliminar campos no necesarios
      delete datos.id_sol;
      delete datos.opc_programa;
      delete datos.acceptRGPD;
      delete datos.consentimientocopiaNIF;
      delete datos.consentimiento_certificadoATIB;
      delete datos.consentimiento_certificadoSegSoc;
      delete datos.declaracion_responsable_ii;

      // Archivos REQUIRED por tipo
      const filesToUpload = [
        { files: this.file_memoriaTecnicaToUpload, type: 'file_memoriaTecnica' },
        { files: this.file_certificadoIAEToUpload, type: 'file_certificadoIAE' },
        { files: this.file_nifEmpresaToUpload, type: 'file_nifEmpresa' },
        { files: this.file_escritura_empresaToUpload, type: 'file_escritura_empresa' },
        { files: this.file_document_acred_como_represToUpload, type: 'file_document_acred_como_repres' },
        { files: this.file_certificadoAEATToUpload, type: 'file_certificadoAEAT' }
      ];

      // Archivos OPC por tipo
      const opcFilesToUpload = [
        { files: this.file_copiaNIFToUpload, type: 'file_copiaNIF' },
        { files: this.file_certificadoATIBToUpload, type: 'file_certificadoATIB' },
        { files: this.file_certificadoSegSocToUpload, type: 'file_certificadoSegSoc' }
      ]

      this.expedienteService.createExpediente(datos).subscribe({
        next: (resp) => {
          datos.id_sol = resp.id_sol;
          this.commonService.showSnackBar('✔️ Expediente creado con éxito ' + resp.message + ' ' + resp.id_sol);

          this.generateDeclaracionResponsable(datos, filesToUpload, opcFilesToUpload)

          // Validación y aplanado de archivos REQUIRED
          const archivosValidos = filesToUpload.flatMap(({ files, type }) => {
            if (!files || files.length === 0) return [];
            return Array.from(files).flatMap((file: File) => {
              if (!file) return [];
              if (file.size === 0) {
                this.commonService.showSnackBar(`⚠️ El archivo "${file.name}" está vacío y no se subirá.`);
                return [];
              }
              if (file.size > 10 * 1024 * 1024) {
                this.commonService.showSnackBar(`⚠️ El archivo "${file.name}" supera el tamaño máximo permitido de 10 MB.`);
                return [];
              }
              return [{ file, type }];
            });
          });

          // Validación y aplanado de archivos OPCIONALES
          const archivosOpcionalesValidos = opcFilesToUpload.flatMap(({ files, type }) => {
            if (!files || files.length === 0) return [];

            return Array.from(files).flatMap((file: File) => {
              if (!file || file.size === 0 || file.size > 10 * 1024 * 1024) return [];
              return [{ file, type }];
            });
          });

          const todosLosArchivos = [...archivosValidos, ...archivosOpcionalesValidos];

          if (todosLosArchivos.length === 0) {
            this.commonService.showSnackBar('⚠️ No hay archivos válidos para subir.');
            return;
          }

          // Subida secuencial de todos los archivos válidos
          from(todosLosArchivos)
            .pipe(
              concatMap(({ file, type }) =>
                this.documentosExpedienteService.createDocumentoExpediente([file], datos, type).pipe(
                  concatMap(() => this.uploadTheFile(timeStamp, [file]))
                )
              )
            )
            .subscribe({
              next: (event) => {
                let mensaje = `📤 ${event.message || 'Subida exitosa'}\n`;
                if (Array.isArray(event.file_name)) {
                  event.file_name.forEach((file: any) => {
                    mensaje += `🗂️ Archivo: ${file.name}\n📁 Ruta: ${file.path}\n`;
                  });
                } else {
                  mensaje += `⚠️ No se encontró información de archivo en el evento.`;
                }
                this.commonService.showSnackBar(mensaje);
              },
              complete: () => {
                this.commonService.showSnackBar('✅ Todas las subidas finalizadas')
              },
              error: (err) => this.commonService.showSnackBar(`❌ Error durante la secuencia de subida: ${err}`)
            });
        },
        error: (err) => {
          let msg = '❌ Error al crear el expediente.\n';
          this.commonService.showSnackBar("err: " + err);
          try {
            const errorMsgObj = JSON.parse(err.messages?.error ?? '{}');
            msg += `💬 ${errorMsgObj.message || 'Se produjo un error inesperado.'}\n`;

            const erroresDetallados = errorMsgObj.errores_detallados;
            if (erroresDetallados) {
              msg += '🔍 Errores detallados:\n';
              Object.entries(erroresDetallados).forEach(([campo, errorCampo]) => {
                msg += ` • ${campo}: ${errorCampo}\n`;
              });
            }
            const datosRecibidos = errorMsgObj.datos_recibidos;
            if (datosRecibidos) {
              msg += '📦 Datos recibidos:\n';
              Object.entries(datosRecibidos).forEach(([key, value]) => {
                msg += ` - ${key}: ${Array.isArray(value) ? value.join(', ') : value}\n`;
              });
            }
          } catch (parseError) {
            msg += `⚠️ No se pudo interpretar el error: ${err}`;
          }
          this.commonService.showSnackBar(msg);
        }
      });
    });
  }

  generateDeclaracionResponsable(datos: any, reqFiles: any, opcFiles: any): void {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      floatPrecision: 16
    });

    doc.setProperties({
      title: `${datos.nif}_${datos.selloDeTiempo}_dec_res_solicitud`,
      subject: 'Tràmits administratius',
      author: 'ADR Balears',
      keywords: 'INDUSTRIA 4.0, DIAGNÓSTIC, DIGITAL, EXPORTA, PIMES, ADR Balears, ISBA, GOIB"; "INDUSTRIA 4.0, DIAGNÓSTIC, DIGITAL, EXPORTA, PIMES, ADR Balears, ISBA, GOIB',
      creator: 'Angular App'
    });

    const pageHeight = doc.internal.pageSize.getHeight()
    const pageWidth = doc.internal.pageSize.getWidth()
    const maxTextWidth = 170

    const footerText = 'Agència de desenvolupament regional\nPlaça Son Castelló, 1\n07009 Polígon de Son Castelló - Palma\nTel. 971 17 61 61\nwww.adrbalears.es'
    const marginLeft = 15;

    // Aplicar distintos estilos en una misma frase
    function printLabelWithBoldValue(doc: jsPDF, fullText: string, x: number, y: number, fontsize: number) {
      doc.setFontSize(fontsize)

      const pageWidth = doc.internal.pageSize.getWidth();
      const marginRight = 15
      const maxWidth = pageWidth - x - marginRight;

      const wrappedLines = doc.splitTextToSize(fullText, maxWidth);

      const [label, value] = fullText.split(':');
      const labelText = `${label}:`;

      // Etiqueta
      doc.setFont('helvetica', 'normal');
      const labelWidth = doc.getTextWidth(labelText);

      const extraSpacing = 1;

      wrappedLines.forEach((line: any, i: any) => {
        const lineY = y + i * (fontsize * 0.35 + 1);
        if (i === 0 && line.startsWith(labelText)) {
          // Label
          doc.setFont('helvetica', 'normal');
          doc.text(labelText, x, lineY);

          // Value (misma linea que label)
          const valuePart = line.slice(labelText.length);
          doc.setFont('helvetica', 'bold');
          doc.text(valuePart, x + labelWidth + extraSpacing, lineY);
        } else {
          // Value (resto)
          doc.setFont('helvetica', 'bold');
          doc.text(line, x, lineY);
        }
      });
    }

    // Printado de bordes
    function printBorder(
      doc: jsPDF,
      input: string | string[],
      x: number,
      y: number,
      fontSize: number,
      pageWidth: number,
      marginRight: number = 15,
      padding: number = 0.75) {
      const lineHeight = fontSize * 0.35 + 1;
      const maxTextWidth = pageWidth - x - marginRight;

      // Convertir en listas
      const texts = Array.isArray(input) ? input : [input];

      // Calcular líneas
      let totalLines = 0;
      texts.forEach(text => {
        const lines = doc.splitTextToSize(text, maxTextWidth);
        totalLines += lines.length;
      });

      // Altura bloque
      const blockHeight = (totalLines - 1) * lineHeight + fontSize;
      const rectY = y - fontSize * 0.5;

      // Dibujar borde
      doc.setDrawColor(0);
      doc.setLineWidth(0.25);
      doc.rect(x - padding, rectY - padding, maxTextWidth + padding * 2, blockHeight + padding * 2)
    }


    this.actoAdminService.getByNameAndTipoTramite('dec_responsable_solicitud_ayuda', 'XECS')
      .subscribe((docDataString: ActoAdministrativoDTO) => {
        let rawTexto
        if (localStorage.getItem("preferredLang") === 'es-ES') {
          rawTexto = docDataString.texto_es
        } else {
          rawTexto = docDataString.texto
        }
        if (!rawTexto) {
          this.commonService.showSnackBar('❌ No se encontró el texto del acto administrativo.');
          return;
        }

        /* Faltaría adaptar los labels según el idioma en que se genere la declaración responsable */

        // Label para tipo_tramite
        let label_tipo_tramite: string;
        switch (datos.tipo_tramite) {
          case 'Programa I':
            label_tipo_tramite = "Programa I, «IDigital»";
            break;
          case "Programa II":
            label_tipo_tramite = "Programa II, «IExporta»";
            break;
          case "Programa III ac":
            label_tipo_tramite = "Programa III, «Isostenibilitat» Corporativa";
            break;
          case "Programa III ap":
            label_tipo_tramite = "Programa III, «Isostenibilitat» Producte";
            break;
          case "Programa IV":
            label_tipo_tramite = "Programa IV, «IGestió»";
            break;
          default:
            label_tipo_tramite = "Programa desconocido";
            break;
        }

        // Label para tipo_solicitante
        let label_tipo_solicitante: string;
        switch (datos.tipo_solicitante) {
          case "autonomo":
            label_tipo_solicitante = "Autónomo";
            break;
          case "pequenya":
            label_tipo_solicitante = "Pequeña Empresa";
            break;
          case "mediana":
            label_tipo_solicitante = "Mediana Empresa";
            break;
          default:
            label_tipo_solicitante = "Tipo desconocido";
            break;
        }

        // Label para opcion_banco
        const label_opcion_banco = datos.opcion_banco == '1' ? "IBAN de la cuenta para España" : "Número de la cuenta de otros países";

        /* Importes monetarios formateados */
        let formattedImporte_minimis!: any;
        if (datos.importe_minimis !== "") {
          formattedImporte_minimis = this.commonService.formatCurrency(datos.importe_minimis);
        }

        // Replace de datos
        rawTexto = rawTexto.replace(/%PROGRAMA_XECS%/g, label_tipo_tramite);

        rawTexto = rawTexto.replace(/%TIPO_SOLICITANTE%/g, label_tipo_solicitante);

        rawTexto = rawTexto.replace(/%NOMBRE_RAZON_SOCIAL%/g, datos.empresa);
        rawTexto = rawTexto.replace(/%NIF%/g, datos.nif);
        rawTexto = rawTexto.replace(/%DOMICILIO%/g, datos.domicilio);
        rawTexto = rawTexto.replace(/%ZIPCODE%/g, datos.cpostal);
        rawTexto = rawTexto.replace(/%LOCALIDAD%/g, datos.localidad);
        rawTexto = rawTexto.replace(/%NOMBRE_REPRESENTANTE_LEGAL%/g, datos.nom_representante);
        rawTexto = rawTexto.replace(/%DNI_REPRESENTANTE_LEGAL%/g, datos.nif_representante);
        rawTexto = rawTexto.replace(/%TELEFONO_CONTACTO_SOLICITANTE%/g, datos.telefono);

        rawTexto = rawTexto.replace(/%DIRECCION_ELECTRONICA_NOTIFICACIONES%/g, datos.email_rep);
        rawTexto = rawTexto.replace(/%TELEFONO_MOVIL_NOTIFICACIONES%/g, datos.telefono_rep);

        rawTexto = rawTexto.replace(/%RAZON_SOCIAL_CONSULTOR%/g, datos.empresa_consultor);
        rawTexto = rawTexto.replace(/%NOMBRE_CONSULTOR%/g, datos.nom_consultor);
        rawTexto = rawTexto.replace(/%TELEFONO_CONSULTOR%/g, datos.tel_consultor);
        rawTexto = rawTexto.replace(/%EMAIL_CONSULTOR%/g, datos.mail_consultor);

        rawTexto = rawTexto.replace(/%NOMBRE_ENTIDAD_BANCARIA%/g, datos.nom_entidad);
        rawTexto = rawTexto.replace(/%DOMICILIO_ENTIDAD_BANCARIA%/g, datos.domicilio_sucursal);
        rawTexto = rawTexto.replace(/%CODIGO_BIC_SWIFT%/g, datos.codigo_BIC_SWIFT);
        rawTexto = rawTexto.replace(/%OPCION_CUENTA%/g, label_opcion_banco);
        rawTexto = rawTexto.replace(/%NUMERO_CUENTA_CORRIENTE%/g, datos.cc_datos_bancarios);

        rawTexto = rawTexto.replace(/%IMPORTE_MINIMIS%/g, formattedImporte_minimis);

        let jsonObject;

        // Limpieza de texto
        try {
          rawTexto = this.commonService.cleanRawText(rawTexto);
        } catch (error) {
          console.error('Error al parsear JSON: ', error);
        } finally {
          jsonObject = JSON.parse(rawTexto)
        }

        let padding = 0.75
        let fontSize = 8
        let totalLines = 4
        const lineHeight = fontSize * 0.35 + 1
        const blockHeight = (totalLines - 1) * lineHeight + fontSize

        // Footer
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7)
        const lines = footerText.split('\n');
        lines.reverse().forEach((line, index) => {
          const y = pageHeight - 10 - (index * lineHeight);
          doc.text(line, marginLeft, y);
        });

        // Primera página
        doc.addImage("../../../assets/images/logo-adrbalears-ceae-byn.png", 'PNG', marginLeft, 20, 75, 15);

        // Información rectángulo superior derecho página 1
        printLabelWithBoldValue(doc, jsonObject.destino, marginLeft + 100, 26, fontSize)
        printLabelWithBoldValue(doc, jsonObject.emisor, marginLeft + 100, 36, fontSize)
        doc.rect((marginLeft + 100) - padding, 20 - padding, 82, blockHeight + padding * 2)

        // Texto convocatoria y año convocatoria
        printLabelWithBoldValue(doc, jsonObject.tramite, marginLeft, 60, fontSize)
        printLabelWithBoldValue(doc, `${jsonObject.convocatoria_sol_idigital}${(this.convocatoria ?? '').toString()}`, marginLeft, 70, fontSize)

        // 1. SELECCIONE EL PROGRAMA DE AYUDA QUE SOLICITA
        const seleccione_el_programa_titTextWidth = doc.getTextWidth(jsonObject.seleccione_el_programa_tit);

        doc.setFont('helvetica', 'normal');
        doc.text(jsonObject.seleccione_el_programa_tit, (pageWidth - seleccione_el_programa_titTextWidth) / 2, 80)

        printBorder(doc, jsonObject.seleccione_el_programa_tit, marginLeft, 79, fontSize, pageWidth)
        printLabelWithBoldValue(doc, jsonObject.programa, marginLeft, 90, fontSize)

        // 2. TIPO DE SOLICITANTE
        const tipo_de_solicitanteTextWidth = doc.getTextWidth(jsonObject.tipo_de_solicitante_tit);

        doc.setFont('helvetica', 'normal');
        doc.text(jsonObject.tipo_de_solicitante_tit, (pageWidth - tipo_de_solicitanteTextWidth) / 2, 100)

        printBorder(doc, jsonObject.tipo_de_solicitante_tit, marginLeft, 99, fontSize, pageWidth)
        printLabelWithBoldValue(doc, jsonObject.tipo_solicitante, marginLeft, 110, fontSize);

        // 3. IDENTIFICACIÓN DEL SOLICITANTE
        const identificacion_solicitanteTextWidth = doc.getTextWidth(jsonObject.identificacion_solicitante_tit);

        doc.setFont('helvetica', 'normal');
        doc.text(jsonObject.identificacion_solicitante_tit, (pageWidth - identificacion_solicitanteTextWidth) / 2, 120);

        printBorder(doc, jsonObject.identificacion_solicitante, marginLeft, 119, fontSize, pageWidth);
        printLabelWithBoldValue(doc, jsonObject.nombre, marginLeft, 130, fontSize);
        printLabelWithBoldValue(doc, jsonObject.nif, marginLeft, 134, fontSize);
        printLabelWithBoldValue(doc, jsonObject.domicilio, marginLeft, 138, fontSize);
        printLabelWithBoldValue(doc, jsonObject.localidad, marginLeft, 142, fontSize);
        printLabelWithBoldValue(doc, jsonObject.nombre_representante_legal, marginLeft, 146, fontSize);
        printLabelWithBoldValue(doc, jsonObject.dni_representante_legal, marginLeft, 150, fontSize);
        printLabelWithBoldValue(doc, jsonObject.telefono_contacto_solicitante, marginLeft, 154, fontSize);

        // 4. NOTIFICACIÓN
        const notificacion_titTextWidth = doc.getTextWidth(jsonObject.notificacion_tit);

        doc.setFont('helvetica', 'normal');
        doc.text(jsonObject.notificacion_tit, (pageWidth - notificacion_titTextWidth) / 2, 165);

        printBorder(doc, jsonObject.notificacion_tit, marginLeft, 164, fontSize, pageWidth);
        doc.text(jsonObject.notificacion_info, marginLeft, 174);

        printLabelWithBoldValue(doc, jsonObject.direccion_electrónica_a_efectos_de_notificaciones, marginLeft, 180, fontSize);
        printLabelWithBoldValue(doc, jsonObject.telefono_movil_a_efectos_de_notificaciones, marginLeft, 184, fontSize);

        // 5. DATOS DEL CONSULTOR
        const datos_consultorTextWidth = doc.getTextWidth(jsonObject.datos_consultor);

        doc.setFont('helvetica', 'normal');
        doc.text(jsonObject.datos_consultor, (pageWidth - datos_consultorTextWidth) / 2, 195);

        printBorder(doc, jsonObject.datos_consultor, marginLeft, 194, fontSize, pageWidth);

        printLabelWithBoldValue(doc, jsonObject.razon_social_consultor, marginLeft, 204, fontSize);
        printLabelWithBoldValue(doc, jsonObject.nombre_consultor, marginLeft, 208, fontSize);
        printLabelWithBoldValue(doc, jsonObject.tel_consultor, marginLeft, 212, fontSize);
        printLabelWithBoldValue(doc, jsonObject.email_consultor, marginLeft, 216, fontSize);

        // Segunda página
        doc.addPage();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        lines.forEach((line, index) => {
          const y = pageHeight - 10 - (index * lineHeight);
          doc.text(line, marginLeft, y);
        })
        doc.addImage("../../../assets/images/logoVertical.png", 'PNG', marginLeft, 20, 17, 22);
        doc.setFontSize(fontSize);

        // 6. DATOS BANCARIOS
        const datos_bancarios_titTextWidth = doc.getTextWidth(jsonObject.datos_bancarios_tit);

        doc.setFont('helvetica', 'normal');
        doc.text(jsonObject.datos_bancarios_tit, (pageWidth - datos_bancarios_titTextWidth) / 2, 57)

        printBorder(doc, jsonObject.datos_bancarios_tit, marginLeft, 56, fontSize, pageWidth);

        printLabelWithBoldValue(doc, jsonObject.nombre_entidad_bancaria, marginLeft, 66, fontSize);
        printLabelWithBoldValue(doc, jsonObject.domicilio_entidad_bancaria, marginLeft, 70, fontSize);
        printLabelWithBoldValue(doc, jsonObject.codigo_BIC_SWIFT, marginLeft, 74, fontSize);
        doc.setFont('helvetica', 'normal');
        doc.text(doc.splitTextToSize(jsonObject.declaracion_datos_bancarios_1, maxTextWidth), marginLeft + 5, 78)
        printLabelWithBoldValue(doc, jsonObject.declaracion_datos_bancarios_2, marginLeft + 10, 86, fontSize);
        printLabelWithBoldValue(doc, jsonObject.declaracion_datos_bancarios_3, marginLeft + 10, 90, fontSize);
        doc.setFont('helvetica', 'normal')
        doc.text(doc.splitTextToSize(jsonObject.declaracion_datos_bancarios_4, maxTextWidth), marginLeft + 5, 94)
        doc.text(doc.splitTextToSize(jsonObject.declaracion_datos_bancarios_5, maxTextWidth), marginLeft + 5, 102)

        // 7. DOCUMENTACION ADJUNTA
        const documentacion_adjunta_titTextWidth = doc.getTextWidth(jsonObject.documentacion_adjunta_tit);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSize);

        doc.text(jsonObject.documentacion_adjunta_tit, (pageWidth - documentacion_adjunta_titTextWidth) / 2, 117);
        printBorder(doc, jsonObject.documentacion_adjunta_tit, marginLeft, 116, fontSize, pageWidth);

        const reqFileList = reqFiles.map((file: any) => file.type);

        let documentacionAdjuntaY = 126;

        for (let i = 0; i < reqFileList.length; i++) {
          const actualFile = reqFileList[i];
          let text;
          let lines;

          if (actualFile === "file_memoriaTecnica" && datos.memoriaTecnicaEnIDI) {
            text = `${i + 1}. ${jsonObject.memoriaTecnicaEnIDI}`
            lines = doc.splitTextToSize(text, maxTextWidth);
          } else if (actualFile === "file_nifEmpresa" && datos.copiaNIFSociedadEnIDI) {
            text = `${i + 1}. ${jsonObject.copiaNIFSociedadEnIDI}`;
            lines = doc.splitTextToSize(text, maxTextWidth);
          } else if (actualFile === "file_escritura_empresa" && datos.pJuridicaDocAcreditativaEnIDI) {
            text = `${i + 1}. ${jsonObject.pJuridicaDocAcreditativaEnIDI}`;
            lines = doc.splitTextToSize(text, maxTextWidth);
          } else {
            text = `${i + 1}. ${jsonObject[actualFile]}`;
            lines = doc.splitTextToSize(text, maxTextWidth);
          }

          doc.text(lines, marginLeft + 5, documentacionAdjuntaY);
          documentacionAdjuntaY += lines.length * (8 * 0.5);
        }

        // Tercera página
        doc.addPage();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        lines.forEach((line, index) => {
          const y = pageHeight - 10 - (index * lineHeight);
          doc.text(line, marginLeft, y);
        })
        doc.addImage("../../../assets/images/logoVertical.png", 'PNG', marginLeft, 20, 17, 22);
        doc.setFontSize(fontSize)

        // 8. AUTORIZACIONES
        const autorizaciones_titTextWidth = doc.getTextWidth(jsonObject.autorizacion_tit);
        doc.setFont('helvetica', 'normal');

        doc.text(jsonObject.autorizacion_tit, (pageWidth - autorizaciones_titTextWidth) / 2, 57);
        printBorder(doc, jsonObject.autorizacion_tit, marginLeft, 56, fontSize, pageWidth);

        const opcFilesList = opcFiles.map((file: any) => file.type);

        const autorizaciones = {
          file_copiaNIF: this.consentimiento_copiaNIF,
          file_certificadoATIB: this.consentimiento_certificadoATIB,
          file_certificadoSegSoc: this.consentimiento_certificadoSegSoc
        }

        const concedidas = Object.entries(autorizaciones).filter(([_, v]) => v === true);
        const noConcedidas = Object.entries(autorizaciones).filter(([_, v]) => v === false);

        let alturaAutorizacion = 66;

        if (concedidas.length > 0) {
          doc.text(jsonObject.autorizacion_concedida_txt, marginLeft, alturaAutorizacion);
          alturaAutorizacion += 4

          concedidas.forEach(([key], index) => {
            const text = `${index + 1}. ${jsonObject[key]}`;
            const lines = doc.splitTextToSize(text, maxTextWidth);
            doc.text(lines, marginLeft + 5, alturaAutorizacion)
            alturaAutorizacion += lines.length * (8 * 0.5)
          })

          if (noConcedidas.length > 0) {
            // Añado un poco más de espacio sin que afecte al caso "no autorizo ninguno"
            alturaAutorizacion += 4
          }
        }

        if (noConcedidas.length > 0) {
          doc.text(jsonObject.autorizacion_no_concedida_txt, marginLeft, alturaAutorizacion);
          alturaAutorizacion += 4

          noConcedidas.forEach(([key], index) => {
            const text = `${index + 1}. ${jsonObject[key]}`;
            const lines = doc.splitTextToSize(text, maxTextWidth);
            doc.text(lines, marginLeft + 5, alturaAutorizacion)
            alturaAutorizacion += lines.length * (8 * 0.5)
          })
        }

        else if (noConcedidas.length === 3) {
          doc.text(jsonObject.autorizacion_no_concedida_txt, marginLeft, alturaAutorizacion);
          alturaAutorizacion += 4
          for (let i = 0; i < opcFilesList.length; i++) {
            const actualFile = opcFilesList[i];
            const text = `${i + 1}. ${jsonObject[actualFile]}`;
            const lines = doc.splitTextToSize(text, maxTextWidth);
            doc.text(lines, marginLeft + 5, alturaAutorizacion);
            alturaAutorizacion += lines.length * (8 * 0.5)
          }
        }

        // 9. DECLARACIÓN RESPONSABLE
        let alturaDecRes = alturaAutorizacion + 10;

        const declaracion_responsable_titTextWidth = doc.getTextWidth(jsonObject.declaracion_responsable);

        doc.setFont('helvetica', 'normal');
        doc.text(jsonObject.declaracion_responsable, (pageWidth - declaracion_responsable_titTextWidth) / 2, alturaDecRes + 1);

        printBorder(doc, jsonObject.declaracion_responsable, marginLeft, alturaDecRes, fontSize, pageWidth);

        alturaDecRes += 14;

        const decResTextBlocks = [
          jsonObject.declaracion_responsable_i,
          datos.importe_minimis !== "" ? jsonObject.declaracion_responsable_ii : null,
          datos.importe_minimis !== "" ? jsonObject.importe_minimis : null,
          jsonObject.declaracion_responsable_iii,
          jsonObject.declaracion_responsable_iv,
          jsonObject.declaracion_responsable_v,
          jsonObject.declaracion_responsable_vi,
          jsonObject.declaracion_responsable_vii,
          jsonObject.declaracion_responsable_viii,
          jsonObject.declaracion_responsable_ix,
          jsonObject.declaracion_responsable_x,
          jsonObject.declaracion_responsable_xi,
          jsonObject.declaracion_responsable_xii,
        ]

        decResTextBlocks.forEach((bloque) => {
          if (bloque) {
            const lines = doc.splitTextToSize(bloque, maxTextWidth);
            doc.text(lines, marginLeft + 5, alturaDecRes);
            alturaDecRes += lines.length * (8 * 0.5);
          }
        })

        // Cuarta página
        doc.addPage();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7)
        lines.forEach((line, index) => {
          const y = pageHeight - 10 - (index * lineHeight);
          doc.text(line, marginLeft, y);
        })

        doc.addImage("../../../assets/images/logoVertical.png", 'PNG', marginLeft, 20, 17, 22);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(jsonObject.prot_datos_personales_tit, marginLeft, 56);
        doc.setFont('helvetica', 'normal');
        doc.text(doc.splitTextToSize(jsonObject.responsable_tratamiento, maxTextWidth), marginLeft + 5, 62);
        doc.text(jsonObject.contacto_dele_proteccion, marginLeft + 5, 70);
        doc.text(jsonObject.web, marginLeft + 5, 75);

        doc.setFont('helvetica', 'bold');
        doc.text(jsonObject.gestion_ayuda_consultoria_tit, marginLeft, 86);
        doc.setFont('helvetica', 'normal')
        doc.text(jsonObject.base_legitima, marginLeft + 5, 92);
        doc.text(jsonObject.categoria_interesados, marginLeft + 5, 97);
        doc.text(jsonObject.tipologia_datos, marginLeft + 5, 102);
        doc.text(doc.splitTextToSize(jsonObject.finalidad, maxTextWidth), marginLeft + 5, 107);
        doc.text(doc.splitTextToSize(jsonObject.categoria_destinatarios, maxTextWidth), marginLeft + 5, 115);
        doc.text(jsonObject.transferencias_internacionales, marginLeft + 5, 123);
        doc.text(doc.splitTextToSize(jsonObject.medidas_tec_org, maxTextWidth), marginLeft + 5, 128);
        doc.text(doc.splitTextToSize(jsonObject.plazos_supresion, maxTextWidth), marginLeft + 5, 136);
        doc.text(doc.splitTextToSize(jsonObject.info_contacto, maxTextWidth), marginLeft, 144);

        doc.setFont('helvetica', 'bold');
        doc.text(jsonObject.ejercicio_derecho_tit, marginLeft, 160)

        doc.setFont('helvetica', 'normal');
        doc.text(doc.splitTextToSize(jsonObject.ejercicio_derecho_txt, maxTextWidth), marginLeft + 5, 166);

        doc.text(jsonObject.firma, marginLeft, 220);

        // Numeración de páginas
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.text(`${i}/${totalPages}`, pageWidth - 20, pageHeight - 10);
        }

        const pdfBlob = doc.output('blob');

        const formData = new FormData();
        const fileName = `${datos.nif}_dec_res_solicitud.pdf`;
        formData.append('file', pdfBlob, fileName);
        formData.append('id_sol', String(datos.id_sol));
        formData.append('convocatoria', String(datos.convocatoria));
        formData.append('nifcif_propietario', String(datos.nif));
        formData.append('timeStamp', String(datos.selloDeTiempo));


        this.actoAdminService.sendDecRespSolPDFToBackEnd(formData).subscribe({ // OK, sube el archivo dec resp al servidor backend
          next: (response) => {
            this.docGenerado.id_sol = datos.id_sol;
            this.docGenerado.cifnif_propietario = datos.nif;
            this.docGenerado.convocatoria = String(datos.convocatoria);
            this.docGenerado.name = 'doc_dec_res_solicitud.pdf';
            this.docGenerado.type = 'application/pdf';
            this.docGenerado.created_at = response.path;
            this.docGenerado.tipo_tramite = datos.tipo_tramite;
            this.docGenerado.corresponde_documento = 'doc_dec_res_solicitud';
            this.docGenerado.selloDeTiempo = datos.selloDeTiempo;
            this.nameDocGenerado = 'doc_dec_res_solicitud.pdf';

            this.insertDeclaracionResponsable(datos);
          }
        })
      })
  }

  insertDeclaracionResponsable(datos: any): void {
    this.documentoGeneradoService.create(this.docGenerado).subscribe({
      next: (resp: any) => {
        this.lastInsertId = resp?.id;
        if (this.lastInsertId) {
          this.expedienteService
            .updateDocFieldExpediente(datos.id_sol, 'doc_dec_res_solicitud', String(this.lastInsertId))
            .subscribe({
              next: (response: any) => {
                const mensaje = response?.message || '✅ Declaración generada y subida';
                this.commonService.showSnackBar(mensaje);
                this.sendUserToSign(datos, this.nameDocGenerado, this.lastInsertId)
              }
            })
        }
      }
    })
  }

  sendUserToSign(data: any, filename: string, doc_id: any) {
    filename = filename.replace(/^doc_/, "");
    filename = `${data.nif}_${filename}`;

    const payload: CreateSignatureRequest = {
      adreca_mail: data.email_rep,
      nombreDocumento: filename,
      nif: data.nif,
      last_insert_id: doc_id,
      timeStamp: String(data.selloDeTiempo)
    };

    this.viafirmaService.createSignatureRequestDecResp(payload)
      .subscribe({
        next: (res: any) => {
          const id = res?.publicAccessId;
          this.declaracion_enviada = true;
          this.commonService.showSnackBar(id ? `Solicitud de firma creada. ID: ${id} y enviada a la dirección: ${payload.adreca_mail}` : 'Solicitud de firma creada correctamente');
        },
        error: (err) => {
          const msg = err?.error?.message || err?.message || 'No se pudo enviar la solicitud de firma';
          this.commonService.showSnackBar(msg);
        }
      })
  }
  /* required files to upload */
  get memoriaTecnicaFileNames(): string {
    return this.file_memoriaTecnicaToUpload.map(f => f.name).join(', ')
  }
  onFileMemoriaTecnicaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_memoriaTecnicaToUpload = Array.from(input.files);
      console.log("this.file_memoriaTecnicaToUpload", this.file_memoriaTecnicaToUpload)
    }
  }
  get certificadoIAEFileNames(): string {
    return this.file_certificadoIAEToUpload.map(f => f.name).join(', ')
  }
  onFileCertificadoIAEChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_certificadoIAEToUpload = Array.from(input.files);
      console.log("this.file_certificadoIAEToUpload", this.file_certificadoIAEToUpload)
    }
  }
  get nifEmpresaFileNames(): string {
    return this.file_nifEmpresaToUpload.map(f => f.name).join(', ')
  }
  onFileNifEmpresaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_nifEmpresaToUpload = Array.from(input.files);
      console.log("this.file_nifEmpresaToUpload", this.file_nifEmpresaToUpload)
    }
  }
  get escrituraPublicaFileNames(): string {
    return this.file_escritura_empresaToUpload.map(f => f.name).join(', ')
  }
  onFileEscrituraEmpresaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_escritura_empresaToUpload = Array.from(input.files);
      console.log("this.file_escritura_empresaToUpload", this.file_escritura_empresaToUpload)
    }
  }
  get docAcredRepresFileNames(): string {
    return this.file_document_acred_como_represToUpload.map(f => f.name).join(', ')
  }
  onFileDocAcredRepresChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_document_acred_como_represToUpload = Array.from(input.files);
      console.log("this.file_document_acred_como_represToUpload", this.file_document_acred_como_represToUpload)
    }
  }
  get certficadoAEATFileNames(): string {
    return this.file_certificadoAEATToUpload.map(f => f.name).join(', ')
  }
  onFilecertificadoAEATChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_certificadoAEATToUpload = Array.from(input.files);
      console.log("this.file_certificadoAEATToUpload", this.file_certificadoAEATToUpload)
    }
  }

  /* optional files to upload */
  get copiaNifFileNames(): string {
    return this.file_copiaNIFToUpload.map(f => f.name).join(', ')
  }
  onFileCopiaNifChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_copiaNIFToUpload = Array.from(input.files);
      console.log("this.file_copiaNIFToUpload", this.file_copiaNIFToUpload)
    }
  }
  get certificadoATIBFileNames(): string {
    return this.file_certificadoATIBToUpload.map(f => f.name).join(', ')
  }
  onFilecertificadoATIBChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_certificadoATIBToUpload = Array.from(input.files);
      console.log("this.file_certificadoATIBToUpload", this.file_certificadoATIBToUpload)
    }
  }
  get certificadoSegSocFileNames(): string {
    return this.file_certificadoSegSocToUpload.map(f => f.name).join(', ')
  }
  onFilecertificadoSegSocChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_certificadoSegSocToUpload = Array.from(input.files);
      console.log("this.file_certificadoSegSocToUpload", this.file_certificadoSegSocToUpload)
    }
  }

  openDialog(enterAnimationDuration: string, exitAnimationDuration: string, questionText: string, toolTipText: string, doc1: string, doc2: string): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = false
    dialogConfig.autoFocus = true
    dialogConfig.panelClass = "dialog-customization"
    dialogConfig.backdropClass = "popupBackdropClass"
    dialogConfig.position = {
      'top': '10%',
      'left': '10%'
    };
    dialogConfig.width = '90%',
      dialogConfig.data = {
        questionText: questionText, toolTipText: toolTipText, doc1: doc1, doc2: doc2
      };
    this.dialog.open(PopUpDialogComponent, dialogConfig);
  }

  onCheckboxChange(event: any, controlName: string) {
    const isChecked = event.checked;
    const control = this.xecsForm.get(controlName);
    if (!control) return;
    // Ajusto los validadores según el estado del checkbox
    if (isChecked) {
      // Si está marcado, quitamos el required
      control.clearValidators();
      if (controlName === 'file_memoriaTecnica' || controlName === 'file_nifEmpresa' || controlName === 'file_escritura_empresa') {
        control.disable()
      }
    } else {
      // Si está desmarcado, agregamos required
      control.setValidators([Validators.required]);
      if (controlName === 'file_memoriaTecnica' || controlName === 'file_nifEmpresa' || controlName === 'file_escritura_empresa') {
        control.enable(); // ✅ Reactiva el input si estaba desactivado
      }
    }
    // Actualiza el estado de validación
    control.updateValueAndValidity();
    console.log('Control:', controlName, 'Checked:', isChecked, 'Validators:', control.validator);
  }

  selectedZipValue(event: MatAutocompleteSelectedEvent): void {
    const selected = event.option.value;
    console.log(selected);
    if (selected && selected.zipCode) {
      this.xecsForm.get('cpostal')?.setValue(selected.zipCode, { emitEvent: false });
      this.xecsForm.get('localidad')?.setValue(selected.town);
    }
  }

  displayFn(zip: any): string {
    return typeof zip === 'object' && zip ? zip.zipCode : zip;
  }

  private _filter(filterValue: string): ZipCodesIBDTO[] {

    return this.cpostals.filter((cpostal: any) =>
      cpostal.id.includes(filterValue)
    );
  }

  private getAllcpostals() {
    this.commonService.getZipCodes().subscribe((zpCodes: ZipCodesIBDTO[]) => {
      const zpCodesFiltered: ZipCodesIBDTO[] = zpCodes.filter((zpCode: ZipCodesIBDTO) => zpCode.deleted_at?.toString() === "0000-00-00 00:00:00")
      this.cpostals = zpCodesFiltered;
    }, (error) => { this.commonService.showSnackBar(error) });
  }

  private getAllCnaes() {
    this.commonService.getCNAEs().subscribe((cnaes: CnaeDTO[]) => {
      const cnaesFiltered: CnaeDTO[] = cnaes.filter((cnae: CnaeDTO) => cnae.deleted_at?.toString() === "0000-00-00 00:00:00")
      this.cnaes = cnaesFiltered;
      this.cnaes = cnaes
    }, (error) => {
      console.error("Error real:", error);
      this.commonService.showSnackBar(error + ' ' + error.message || 'Error');
    });
  }

  private getAllXecsPrograms() {
    this.commonService.getXecsPrograms().subscribe((programs: XecsProgramsDTO[]) => {
      this.xecsPrograms = programs
    })
  }

  private getResponsabilityDeclarations() {
    this.commonService.getResponsabilityDeclarations().subscribe((responsibilityDeclarations: ResponsabilityDeclarationDTO[]) => {
      responsibilityDeclarations.map((item: ResponsabilityDeclarationDTO) => {
        if (localStorage.getItem('preferredLang') === 'ca-ES') {
          item.label = item.label_ca
        }
      })
      this.responsibilityDeclarations = responsibilityDeclarations
    })
  }

  private getDocumentationAndAuthorizations() {
    this.commonService.getDocumentationAndAuthorizations().subscribe((authorizations: AuthorizationTextDTO[]) => {
      authorizations.map((item: AuthorizationTextDTO) => {
        if (localStorage.getItem('preferredLang') === 'ca-ES') {
          item.label = item.label_ca
        }
      })
      this.authorizations = authorizations
    })
  }

  uploadTheFile(timestamp: string, files: File[]): Observable<any> {
    if (!files || files.length === 0) {
      return of(null); // Devuelve observable vacío si no hay archivos
    }

    const formData = new FormData();
    const nif = this.xecsForm.value.nif;
    files.forEach(file => {
      formData.append('files[]', file);
    });
    console.log(files)

    return this.documentService.createDocument(nif, timestamp, formData).pipe(
      tap((event: HttpEvent<any>) => {
        switch (event.type) {
          case HttpEventType.Sent:
            this.commonService.showSnackBar('Archivos enviados al servidor...');
            break;
          case HttpEventType.UploadProgress:
            if (event.total) {
              this.uploadProgress = Math.round((100 * event.loaded) / event.total);
            }
            break;
          case HttpEventType.Response:
            this.commonService.showSnackBar('Archivos subidos con éxito: ' + event.body);
            this.uploadProgress = 100;
            break;
        }
      }),
      catchError(err => {
        this.commonService.showSnackBar('Error al subir los archivos: ' + err);
        return throwError(() => err);
      })
    );
  }

  private getLineDetail(convocatoria: number) {
    this.lineaAyuda.getAll().subscribe((lineaAyudaItems: PindustLineaAyudaDTO[]) => {
      lineaAyudaItems.filter((item: PindustLineaAyudaDTO) => {
        if (item.convocatoria == convocatoria && item.lineaAyuda === "XECS" && item.activeLineData === "SI") {
          this.num_BOIB = item['num_BOIB']
          this.translate.get('HEADER.CONVODATA').subscribe(text => {
            this.convocatoria = item['convocatoria']
            this.convoData = text.replace('%CODIGOSIA%', item['codigoSIA']).replace('%CONVO%', item['convocatoria'])
          });
        }
      });


    })
  }

}