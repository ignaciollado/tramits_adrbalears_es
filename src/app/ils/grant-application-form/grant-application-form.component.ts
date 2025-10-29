import { CommonModule } from '@angular/common';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { Component, EventEmitter, inject, Output, signal, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogConfig, MatDialogModule } from '@angular/material/dialog';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import jsPDF from 'jspdf';
import { catchError, concatMap, from, map, Observable, of, startWith, tap, throwError } from 'rxjs';
import { ActoAdministrativoDTO } from '../../Models/acto-administrativo-dto';
import { CnaeDTO } from '../../Models/cnae.dto';
import { DocumentoGeneradoDTO } from '../../Models/documentos-generados-dto';
import { CreateSignatureRequest } from '../../Models/signature.dto';
import { ZipCodesIBDTO } from '../../Models/zip-codes-ib.dto';
import { PopUpDialogComponent } from '../../popup-dialog/popup-dialog.component';
import { ActoAdministrativoService } from '../../Services/acto-administrativo.service';
import { CommonService } from '../../Services/common.service';
import { CustomValidatorsService } from '../../Services/custom-validators.service';
import { DocumentService } from '../../Services/document.service';
import { DocumentosGeneradosService } from '../../Services/documentos-generados.service';
import { ExpedienteDocumentoService } from '../../Services/expediente.documento.service';
import { ExpedienteService } from '../../Services/expediente.service';
import { ViafirmaService } from '../../Services/viafirma.service';


@Component({
  selector: 'app-grant-application-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatSelectModule, MatExpansionModule,
    MatAccordion, MatIconModule, MatCheckboxModule, MatRadioModule,
    TranslateModule, MatTooltipModule, MatAutocompleteModule, MatDialogModule],
  templateUrl: './grant-application-form.component.html',
  styleUrl: './grant-application-form.component.scss'
})

export class IlsGrantApplicationFormComponent {
  @Output() noHeader = new EventEmitter<boolean>();
  private route = inject(ActivatedRoute)
  readonly dialog = inject(MatDialog)
  step = signal(0)
  uploadProgress: number = 0;
  ilsForm: FormGroup
  radioOptionDocs: string = ""
  rgpdAccepted = false
  businessType: string = "";

  // 10 MB máximos
  maxFileSizeBytes: number = 10 * 1024 * 1024

  // Checkboxes
  checkboxID: boolean = true
  checkboxATIB: boolean = true

  // Datos externos
  zipCodeList: ZipCodesIBDTO[] = []
  options: ZipCodesIBDTO[] = []
  filteredOptions: Observable<ZipCodesIBDTO[]> | undefined;
  actividadesCNAE: CnaeDTO[] = []

  idExp: string = ""

  declaracionResponsableGenerada: File[] = [];

  declaracion_enviada: boolean = false;
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

  nameDocGenerado!: string;

  actualLang!: string;

  submitting: boolean = false;

  accordion = viewChild.required(MatAccordion)
  constructor(private commonService: CommonService, private expedienteService: ExpedienteService,
    private documentService: DocumentService,
    private documentosExpedienteService: ExpedienteDocumentoService,
    private customValidator: CustomValidatorsService, private fb: FormBuilder,
    private snackBar: MatSnackBar, private actoAdminService: ActoAdministrativoService,
    private viafirmaService: ViafirmaService, private documentoGeneradoService: DocumentosGeneradosService,
    private translate: TranslateService) {
    this.ilsForm = this.fb.group({

      acceptRGPD: this.fb.control<boolean | null>(false, [Validators.required]),
      fecha_completado: this.fb.control(this.commonService.getCurrentDateTime()),

      tipo_solicitante: this.fb.control<string>('', [Validators.required]),
      nif: this.fb.control<string>({ value: '', disabled: true }, []), // Validadores seteados posteriormente
      empresa: this.fb.control<string>('', [Validators.required, this.customValidator.xssProtectorValidator()]),
      domicilio: this.fb.control<string>('', [Validators.required, this.customValidator.xssProtectorValidator()]),
      cpostal: this.fb.control<string>('', [Validators.required, Validators.minLength(5), Validators.maxLength(5)]),
      localidad: this.fb.control<string>({ value: '', disabled: true }),
      telefono: this.fb.control<string>('', [Validators.required, Validators.pattern('[0-9]{9}'), Validators.maxLength(9), Validators.minLength(9)]),
      iae: this.fb.control<string>('', [Validators.required]),
      sitio_web_empresa: this.fb.control<string>('', [this.customValidator.xssProtectorValidator()]),
      video_empresa: this.fb.control<string>('', [this.customValidator.xssProtectorValidator()]),
      nombre_rep: this.fb.control<string>('', [Validators.required, this.customValidator.xssProtectorValidator()]),
      nif_rep: this.fb.control<string>('', [Validators.required, Validators.minLength(9), Validators.maxLength(9), this.customValidator.dniNieValidator()]),
      telefono_rep: this.fb.control<string>('', [Validators.required, Validators.pattern('[0-9]{9}'), Validators.maxLength(9)]),
      email_rep: this.fb.control<string>('', [Validators.required, Validators.email]),

      checkboxID: this.fb.control<boolean>(true, []),
      file_enviardocumentoIdentificacion: this.fb.control<File | null>({ value: null, disabled: true }, [Validators.required]),
      checkboxATIB: this.fb.control<boolean>(true, []),
      file_certificadoATIB: this.fb.control<File | null>({ value: null, disabled: true }, [Validators.required]),

      cumpleRequisitos_dec_resp: this.fb.control<string>({ value: 'SI', disabled: true }, []),
      epigrafeIAE_dec_resp: this.fb.control<string>({ value: 'SI', disabled: true }, []),
      registroIndustrialMinero_dec_resp: this.fb.control<string>({ value: 'SI', disabled: true }, []),
      cumpleNormativaSegInd_dec_resp: this.fb.control<string>({ value: 'SI', disabled: true }, []),

      // Documentación
      file_escritura_empresa: this.fb.control<File | null>(null, [Validators.required]),
      file_certificadoIAE: this.fb.control<File | null>(null, [Validators.required]),
      radioGroupFile: this.fb.control(null, []),
      file_informeResumenIls: this.fb.control<File | null>({ value: null, disabled: true }, []), // Primera opción radio
      file_informeInventarioIls: this.fb.control<File | null>({ value: null, disabled: true }, []), // Primera opción radio
      file_certificado_verificacion_ISO: this.fb.control<File | null>({ value: null, disabled: true }, []), // Segunda opción radio
      file_modeloEjemploIls: this.fb.control<File | null>(null, [Validators.required]),
      file_certificado_itinerario_formativo: this.fb.control<File | null>(null, [Validators.required]),

      file_memoriaTecnica: this.fb.control<File | null>(null, []),
      file_nifEmpresa: this.fb.control<File | null>(null, []),
      file_logotipoEmpresaIls: this.fb.control<File | null>(null, []),

      tipo_tramite: this.fb.control<string>('ILS', []),
    })
  }

  ngOnInit(): void {
    this.noHeader.emit(true);
    // Traducción por URL
    this.actualLang = this.route.snapshot.paramMap.get('lang')!;
    this.translate.use(this.actualLang)

    // Desbloqueo por RGPD
    this.ilsForm.get('acceptRGPD')?.valueChanges.subscribe((value: boolean) => {
      this.rgpdAccepted = value
    })

    this.filteredOptions = this.ilsForm.get('cpostal')?.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value;
        return name ? this._filter(name as string) : this.options.slice();
      })
    );

    this.ilsForm.get('radioGroupFile')?.valueChanges.subscribe((value: string) => {
      this.onRadioChange(value)
    })

    this.loadZipcodes()
    this.loadActividadesCNAE()
    this.generateIdExp()
  }
  file_enviardocumentoIdentificacionToUpload: File[] = []       // OPT
  file_certificadoATIBToUpload: File[] = []                     // OPT

  file_escritura_empresaToUpload: File[] = []                   // required
  file_certificadoIAEToUpload: File[] = []                      // required
  file_informeResumenIlsToUpload: File[] = []                   // OPT --> Opción 1 radio
  file_informeInventarioIlsToUpload: File[] = []                // OPT --> Opción 1 radio
  file_certificado_verificacion_ISOToUpload: File[] = []        // OPT --> Opción 2 radio
  file_modeloEjemploIlsToUpload: File[] = []                    // required
  file_certificado_itinerario_formativoToUpload: File[] = []    // required
  file_memoriaTecnicaToUpload: File[] = []                      // OPT
  file_nifEmpresaToUpload: File[] = []                          // OPT
  file_logotipoEmpresaIlsToUpload: File[] = []                  // OPT

  onRadioChange(value: string): void {
    const file_informeResumenIlsControl = this.ilsForm.get('file_informeResumenIls');
    const file_informeInventarioIlsControl = this.ilsForm.get('file_informeInventarioIls');
    const file_certificado_verificacion_ISOControl = this.ilsForm.get('file_certificado_verificacion_ISO');

    [file_informeResumenIlsControl, file_informeInventarioIlsControl, file_certificado_verificacion_ISOControl].forEach(control => {
      control?.clearValidators()
    })

    if (value === "option1") {
      [file_informeResumenIlsControl, file_informeInventarioIlsControl].forEach(control => {
        control?.setValidators([Validators.required]);
        control?.enable();
      })

      file_certificado_verificacion_ISOControl?.disable();
      this.file_certificado_verificacion_ISOToUpload = [];
    } else {
      [file_informeResumenIlsControl, file_informeInventarioIlsControl].forEach(control => {
        control?.disable();
      })

      file_certificado_verificacion_ISOControl?.setValidators([Validators.required]);
      file_certificado_verificacion_ISOControl?.enable();
      this.file_informeResumenIlsToUpload = [];
      this.file_informeInventarioIlsToUpload = [];
    }

    [file_informeResumenIlsControl, file_informeInventarioIlsControl, file_certificado_verificacion_ISOControl].forEach(control => {
      control?.updateValueAndValidity();
    })
  }

  onCheckboxChange(event: any, controlName: string) {
    const isChecked = event.checked;
    const control = this.ilsForm.get(controlName);

    if (!control) return;

    if (isChecked) {
      control.clearValidators();
      if (controlName === 'file_enviardocumentoIdentificacion' || controlName === 'file_certificadoATIB') {
        control.disable();
      }
    } else {
      control.setValidators([Validators.required]);
      if (controlName === 'file_enviardocumentoIdentificacion' || controlName === 'file_certificadoATIB') {
        control.enable();
      }
    }

    control.updateValueAndValidity()
  }

  onSubmit(): void {
    this.submitting = true;
    const timeStamp = this.commonService.generateCustomTimestamp()
    const convocatoria = new Date().getFullYear();

    const rawValues = this.ilsForm.getRawValue();
    rawValues.idExp = this.idExp;
    rawValues.selloDeTiempo = timeStamp;
    rawValues.convocatoria = convocatoria
    rawValues.cpostal = this.ilsForm.get('cpostal')?.value['zipCode']

    const filesToUpload = [
      { files: this.file_escritura_empresaToUpload, type: 'file_escritura_empresa' },
      { files: this.file_certificadoIAEToUpload, type: 'file_certificadoIAE' },
      { files: this.file_modeloEjemploIlsToUpload, type: 'file_modeloEjemploIls' },
      { files: this.file_certificado_itinerario_formativoToUpload, type: 'file_certificado_itinerario_formativo' }

    ]

    const opcFilesToUpload = [
      { files: this.file_enviardocumentoIdentificacionToUpload, type: 'file_enviardocumentoIdentificacion' },
      { files: this.file_certificadoATIBToUpload, type: 'file_certificadoATIB' },
      { files: this.file_informeResumenIlsToUpload, type: 'file_informeResumenIls' },
      { files: this.file_informeInventarioIlsToUpload, type: 'file_informeInventarioIls' },
      { files: this.file_certificado_verificacion_ISOToUpload, type: 'file_certificado_verificacion_ISO' },
      { files: this.file_memoriaTecnicaToUpload, type: 'file_memoriaTecnica' },
      { files: this.file_nifEmpresaToUpload, type: 'file_nifEmpresa' },
      { files: this.file_logotipoEmpresaIlsToUpload, type: 'file_logotipoEmpresaIls' }
    ]


    this.expedienteService.createExpediente(rawValues).subscribe({
      next: (respuesta) => {
        rawValues.id_sol = respuesta.id_sol
        this.showSnackBar('✔️ Expediente creado con éxito ' + respuesta.message + ' ' + respuesta.id_sol)
        this.generateDeclaracionResponsable(rawValues, filesToUpload, opcFilesToUpload);

        const archivosValidos = filesToUpload.flatMap(({ files, type }) => {
          if (!files || files.length === 0) return [];

          return Array.from(files).flatMap((file: File) => {
            if (!file) return [];
            if (file.size === 0) {
              this.showSnackBar(`⚠️ El archivo "${file.name}" está vacío y no se subirá.`)
              return [];
            }
            if (file.size > this.maxFileSizeBytes) {
              this.showSnackBar(`⚠️ El archivo "${file.name}" supera el tamaño máximo permitido de 10 MB.`)
              return [];
            }
            return [{ file, type }];
          });
        });

        const archivosOpcionalesValidos = opcFilesToUpload.flatMap(({ files, type }) => {
          if (!files || files.length === 0) return [];

          return Array.from(files).flatMap((file: File) => {
            if (!file || file.size === 0 || file.size > this.maxFileSizeBytes) return [];
            return [{ file, type }]
          });
        });

        const todosLosArchivos = [...archivosValidos, ...archivosOpcionalesValidos]

        if (todosLosArchivos.length === 0) {
          this.showSnackBar('⚠️ No hay archivos válidos para subir.');
          return;
        }

        from(todosLosArchivos)
          .pipe(
            concatMap(({ file, type }) =>
              this.documentosExpedienteService.createDocumentoExpediente([file], rawValues, type).pipe(
                concatMap(() => this.uploadTheFile(timeStamp, [file]))
              )
            )
          )
          .subscribe({
            next: (event) => {
              let mensaje = `📤 ${event.message || 'Subida exitosa'}\n`;
              if (Array.isArray(event.file_name)) {
                event.file_name.forEach((file: any) => {
                  mensaje += `🗂️ Archivo: ${file.name}\n📁 Ruta: ${file.path}\n`
                });
              } else {
                mensaje += `⚠️ No se encontró información de archivo en el evento.`
              }
              this.showSnackBar(mensaje);
            },
            complete: () => this.showSnackBar('✅ Todas las subidas finalizadas'),
            error: (err) => this.showSnackBar(`❌ Error durante la secuencia de subida: ${err}`)
          })
      },
      error: (err) => {
        let msg = '❌ Error al crear el expediente.\n'
        this.showSnackBar("err: " + err);
        try {
          const errorMsgObj = JSON.parse(err.messages?.error ?? '{}');
          msg += `💬 ${errorMsgObj.message || 'Se produjo un error inesperado.'}\n`

          const erroresDetallados = errorMsgObj.errores_detallados;
          if (erroresDetallados) {
            msg += '🔍 Errores detallados:\n'
            Object.entries(erroresDetallados).forEach(([campo, errorCampo]) => {
              msg += ` • ${campo}: ${errorCampo}\n`
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
          msg += `⚠️ No se pudo interpretar el error: ${err}`
        }
        this.showSnackBar(msg)
        this.submitting = false;
      }
    });
  }

  private uploadTheFile(timestamp: string, files: File[]): Observable<any> {
    if (!files || files.length === 0) {
      return of(null); // Devuelve vacío si no hay archivos
    }

    const formData = new FormData();
    const nif = this.ilsForm.value.nif
    files.forEach(file => {
      formData.append('files[]', file);
    })
    console.log(files)

    return this.documentService.createDocument(nif, timestamp, formData).pipe(
      tap((event: HttpEvent<any>) => {
        switch (event.type) {
          case HttpEventType.Sent:
            this.showSnackBar('Archivos enviados al servidor...')
            break;

          case HttpEventType.UploadProgress:
            if (event.total) {
              this.uploadProgress = Math.round((100 * event.loaded) / event.total)
            }
            break;

          case HttpEventType.Response:
            this.showSnackBar('Archivos subidos con éxito: ' + event.body)
            this.uploadProgress = 100;
            break;
        }
      }),
      catchError(err => {
        this.showSnackBar('Error al subir los archivos: ' + err);
        return throwError(() => err);
      })
    )
  }

  /* Documentos de subida obligatoria */
  get file_escritura_empresaFileNames(): string {
    return this.file_escritura_empresaToUpload.map(f => f.name).join(', ')
  }
  onfile_escritura_empresaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_escritura_empresaToUpload = Array.from(input.files)
    }
  }

  get file_certificadoIAEFileNames(): string {
    return this.file_certificadoIAEToUpload.map(f => f.name).join(', ')
  }
  onfile_certificadoIAEChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_certificadoIAEToUpload = Array.from(input.files)
    }
  }

  get file_modeloEjemploIlsFileNames(): string {
    return this.file_modeloEjemploIlsToUpload.map(f => f.name).join(', ')
  }
  onfile_modeloEjemploIlsChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_modeloEjemploIlsToUpload = Array.from(input.files)
    }
  }

  get file_certificado_itinerario_formativoFileNames(): string {
    return this.file_certificado_itinerario_formativoToUpload.map(f => f.name).join(', ')
  }
  onfile_certificado_itinerario_formativoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_certificado_itinerario_formativoToUpload = Array.from(input.files)
    }
  }

  /* Documentos de subida opcional */
  get file_enviardocumentoIdentificacionFileNames(): string {
    return this.file_enviardocumentoIdentificacionToUpload.map(f => f.name).join(', ')
  }
  onfile_enviardocumentoIdentificacionChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_enviardocumentoIdentificacionToUpload = Array.from(input.files)
    }
  }

  get file_certificadoATIBFileNames(): string {
    return this.file_certificadoATIBToUpload.map(f => f.name).join(', ')
  }
  onfile_certificadoATIBChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_certificadoATIBToUpload = Array.from(input.files)
    }
  }

  get file_informeResumenIlsFileNames(): string {
    return this.file_informeResumenIlsToUpload.map(f => f.name).join(', ')
  }
  onfile_informeResumenIlsChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_informeResumenIlsToUpload = Array.from(input.files)
    }
  }

  get file_informeInventarioIlsFileNames(): string {
    return this.file_informeInventarioIlsToUpload.map(f => f.name).join(', ')
  }
  onfile_informeInventarioIlsChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_informeInventarioIlsToUpload = Array.from(input.files)
    }
  }

  get file_certificado_verificacion_ISOFileNames(): string {
    return this.file_certificado_verificacion_ISOToUpload.map(f => f.name).join(', ')
  }
  onfile_certificado_verificacion_ISOChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_certificado_verificacion_ISOToUpload = Array.from(input.files)
    }
  }

  get file_memoriaTecnicaFileNames(): string {
    return this.file_memoriaTecnicaToUpload.map(f => f.name).join(', ')
  }
  onfile_memoriaTecnicaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_memoriaTecnicaToUpload = Array.from(input.files)
    }
  }
  get file_nifEmpresaFileNames(): string {
    return this.file_nifEmpresaToUpload.map(f => f.name).join(', ')
  }
  onfile_nifEmpresaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_nifEmpresaToUpload = Array.from(input.files)
    }
  }
  get file_logotipoEmpresaIlsFileNames(): string {
    return this.file_logotipoEmpresaIlsToUpload.map(f => f.name).join(', ')
  }
  onfile_logotipoEmpresaIlsChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_logotipoEmpresaIlsToUpload = Array.from(input.files)
    }
  }

  generateDeclaracionResponsable(data: any, reqFiles: any, opcFiles: any): void {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      floatPrecision: 16
    });

    doc.setProperties({
      title: `${data.nif}_${data.selloDeTiempo}_declaracion_responsable_ils`,
      subject: 'Tràmits administratius',
      author: 'ADR Balears',
      keywords: 'INDUSTRIA 4.0, DIAGNÓSTIC, DIGITAL, EXPORTA, PIMES, ADR Balears, ISBA, GOIB"; "INDUSTRIA 4.0, DIAGNÓSTIC, DIGITAL, EXPORTA, PIMES, ADR Balears, ISBA, GOIB',
      creator: 'Angular App'
    });

    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxTextWidth = 170;

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
      doc.rect(
        x - padding,
        rectY - padding,
        maxTextWidth + padding * 2,
        blockHeight + padding * 2
      )
    }

    const fontSize = 8;
    const lineHeight = fontSize * 0.35 + 1;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7)
    const lines = footerText.split('\n');
    lines.reverse().forEach((line, index) => {
      const y = pageHeight - 10 - (index * lineHeight);
      doc.text(line, marginLeft, y);
    });

    this.actoAdminService.getByNameAndTipoTramite('dec_responsable_solicitud_adhesion', 'ILS')
      .subscribe((docDataString: ActoAdministrativoDTO) => {

        // Declaración en cas o cat.
        let rawTexto = this.actualLang === 'es-ES' ? docDataString.texto_es : docDataString.texto

        if (!rawTexto) {
          this.commonService.showSnackBar('❌ No se encontró el texto del acto administrativo.');
          return;
        }

        let label_tipo_solicitante: string;
        switch (data.tipo_solicitante) {
          case "autonomo":
            label_tipo_solicitante = this.actualLang === 'es-ES' ? 'Autónomo' : 'Autònom';
            break;
          case "pequenya":
            label_tipo_solicitante = this.actualLang === 'es-ES' ? 'Pequeña Empresa' : 'Petita Empresa';
            break;
          case "mediana":
            label_tipo_solicitante = this.actualLang === 'es-ES' ? 'Mediana Empresa' : 'Mitjana Empresa';
            break;

          default:
            label_tipo_solicitante = this.actualLang === 'es-ES' ? 'Tipo desconocido' : 'Tipus desconegut';
            break;
        }

        /* Formateo y reemplazo de datos */
        rawTexto = rawTexto.replace(/%TIPO_SOLICITANTE%/g, label_tipo_solicitante);
        rawTexto = rawTexto.replace(/%EMPRESA%/g, data.empresa);
        rawTexto = rawTexto.replace(/%NIF%/g, data.nif);
        rawTexto = rawTexto.replace(/%DOMICILIO%/g, data.domicilio);
        rawTexto = rawTexto.replace(/%CPOSTAL%/g, data.cpostal);
        rawTexto = rawTexto.replace(/%LOCALIDAD%/g, data.localidad);
        rawTexto = rawTexto.replace(/%NOMBRE_REP%/g, data.nombre_rep);
        rawTexto = rawTexto.replace(/%NIF_REP%/g, data.nif_rep);
        rawTexto = rawTexto.replace(/%EMAIL_REP%/g, data.email_rep);
        rawTexto = rawTexto.replace(/%TELEFONO_REP%/g, data.telefono_rep);

        let jsonObject;

        try {
          rawTexto = this.commonService.cleanRawText(rawTexto);
        } catch (error) {
          console.error('Error al parsear JSON: ', error);
        } finally {
          jsonObject = JSON.parse(rawTexto)
        }

        let padding = 0.75
        let totalLines = 4
        const lineHeight = fontSize * 0.35 + 1
        const blockHeight = (totalLines - 1) * lineHeight + fontSize

        // Primera página
        doc.addImage('../../../assets/images/logo-adrbalears-ils.png', 'PNG', 25, 20, 70, 10);

        // Información rectángulo superior derecho página 1
        printLabelWithBoldValue(doc, jsonObject.destino, marginLeft + 100, 26, fontSize)
        printLabelWithBoldValue(doc, jsonObject.emisor, marginLeft + 100, 36, fontSize)
        doc.rect((marginLeft + 100) - padding, 20 - padding, 82, blockHeight + padding * 2)

        // Texto intro
        printLabelWithBoldValue(doc, jsonObject.intro_ils_solicitud, marginLeft, 60, fontSize)

        // 1. TIPO DE EMPRESA
        const tipo_empresa_titTextWidth = doc.getTextWidth(jsonObject.solicitante_tipo_ils);
        doc.setFont('helvetica', 'normal');
        doc.text(jsonObject.solicitante_tipo_ils, (pageWidth - tipo_empresa_titTextWidth) / 2, 80)

        printBorder(doc, jsonObject.solicitante_tipo_ils, marginLeft, 79, fontSize, pageWidth)
        printLabelWithBoldValue(doc, jsonObject.solicitante_tipo_ils_txt, marginLeft, 90, fontSize)

        // 2. DATOS DE EMPRESA
        const identificacion_empresa_ilsTextWidth = doc.getTextWidth(jsonObject.identificacion_empresa_ils);

        doc.setFont('helvetica', 'normal');
        doc.text(jsonObject.identificacion_empresa_ils, (pageWidth - identificacion_empresa_ilsTextWidth) / 2, 100);

        printBorder(doc, jsonObject.identificacion_empresa_ils, marginLeft, 99, fontSize, pageWidth);
        printLabelWithBoldValue(doc, jsonObject.solicitante_ils, marginLeft, 110, fontSize);
        printLabelWithBoldValue(doc, jsonObject.nif_solicitante, marginLeft, 114, fontSize);
        printLabelWithBoldValue(doc, jsonObject.domicilio, marginLeft, 118, fontSize);
        printLabelWithBoldValue(doc, jsonObject.localidad, marginLeft, 122, fontSize);
        printLabelWithBoldValue(doc, jsonObject.nom_rep_legal_sol_idigital, marginLeft, 126, fontSize);
        printLabelWithBoldValue(doc, jsonObject.nif_rep_legal_sol_idigital, marginLeft, 130, fontSize);

        // 3. NOTIFICACIÓN
        const notificacion_titTextWidth = doc.getTextWidth(jsonObject.notificacion_corto);

        doc.setFont('helvetica', 'normal');
        doc.text(jsonObject.notificacion_corto, (pageWidth - notificacion_titTextWidth) / 2, 140);

        printBorder(doc, jsonObject.notificacion_corto, marginLeft, 139, fontSize, pageWidth)
        doc.text(jsonObject.notificacion_info, marginLeft, 149)

        printLabelWithBoldValue(doc, jsonObject.mail_rep_legal_sol_idigital, marginLeft, 156, fontSize)
        printLabelWithBoldValue(doc, jsonObject.tel_rep_legal_sol_idigital, marginLeft, 160, fontSize)

        // 4. DOCUMENTACIÓN
        const nonOptionalTypes = ['file_informeResumenIls', 'file_informeInventarioIls', 'file_certificado_verificacion_ISO'];
        const checkboxType = ['file_enviardocumentoIdentificacion', 'file_certificadoATIB'];

        // No opcionales
        const nonOptionalFiles = opcFiles.filter((file: any) => nonOptionalTypes.includes(file.type));
        reqFiles.push(...nonOptionalFiles);

        // Quito las no opcionales y las que son dependientes de un checkbox
        opcFiles = opcFiles.filter((file: any) => !nonOptionalTypes.includes(file.type) && !checkboxType.includes(file.type));

        // Requeridos + los no opcionales
        const reqFileList = reqFiles.filter((file: any) => file.files.length !== 0).map((file: any) => file.type);

        // Opcionales
        const opcFileList = opcFiles.filter((file: any) => file.files.length !== 0).map((file: any) => file.type)

        let documentacionAdjuntaY = 180;

        // 4.1. DOCUMENTACIÓN REQUERIDA
        const doc_req_titTextWidth = doc.getTextWidth(jsonObject.documentacion_adjuntada_ils)

        doc.setFont('helvetica', 'normal');
        doc.text(jsonObject.documentacion_adjuntada_ils, (pageWidth - doc_req_titTextWidth) / 2, 170);

        printBorder(doc, jsonObject.documentacion_adjuntada_ils, marginLeft, 169, fontSize, pageWidth);

        for (let i = 0; i < reqFileList.length; i++) {
          const actualFile = reqFileList[i];
          const text = `${i + 1}. ${jsonObject[actualFile]}`;
          const lines = doc.splitTextToSize(text, maxTextWidth);

          doc.text(lines, marginLeft + 5, documentacionAdjuntaY);
          documentacionAdjuntaY += lines.length * (8 * 0.5);
        }

        documentacionAdjuntaY += 10

        // 4.2. DOCUMENTACIÓN OPCIONAL
        const doc_opc_titTextWidth = doc.getTextWidth(jsonObject.documentacion_adjuntada_opcional_ils);

        doc.text(jsonObject.documentacion_adjuntada_opcional_ils, (pageWidth - doc_opc_titTextWidth) / 2, documentacionAdjuntaY)

        printBorder(doc, jsonObject.documentacion_adjuntada_opcional_ils, marginLeft, documentacionAdjuntaY - 1, fontSize, pageWidth)

        documentacionAdjuntaY += 10;

        for (let i = 0; i < opcFileList.length; i++) {
          const actualFile = opcFileList[i];
          const text = `${i + 1}. ${jsonObject[actualFile]}`;
          const lines = doc.splitTextToSize(text, maxTextWidth);

          doc.text(lines, marginLeft + 5, documentacionAdjuntaY);
          documentacionAdjuntaY += lines.length * (8 * 0.5);
        }

        // Segunda página
        doc.addPage();
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        lines.forEach((line, index) => {
          const y = pageHeight - 10 - (index * lineHeight);
          doc.text(line, marginLeft, y);
        })

        doc.addImage("../../../assets/images/logoVertical.png", 'PNG', marginLeft, 20, 17, 22);
        doc.setFontSize(fontSize);

        // 5. AUTORIZACIONES
        const autorizaciones_titTextWidth = doc.getTextWidth(jsonObject.autorizaciones_solicitud_ils);

        doc.text(jsonObject.autorizaciones_solicitud_ils, (pageWidth - autorizaciones_titTextWidth) / 2, 57);

        printBorder(doc, jsonObject.autorizaciones_solicitud_ils, marginLeft, 56, fontSize, pageWidth)

        if (data.checkboxID === true) {
          doc.text(doc.splitTextToSize(jsonObject.consentimiento_identificacion_solicitante_si, maxTextWidth), marginLeft, 66);
        } else {
          doc.text(doc.splitTextToSize(jsonObject.consentimiento_identificacion_solicitante_no, maxTextWidth), marginLeft, 66);
          doc.setFont('helvetica', 'bold');
          doc.text(doc.splitTextToSize(jsonObject.file_enviardocumentoIdentificacion, maxTextWidth), marginLeft + 5, 74);
        }

        doc.setFont('helvetica', 'normal');
        if (data.checkboxATIB === true) {
          doc.text(doc.splitTextToSize(jsonObject.doy_mi_consentimiento_aeat_atib_si, maxTextWidth), marginLeft, 80);
        } else {
          doc.text(doc.splitTextToSize(jsonObject.doy_mi_consentimiento_aeat_atib_no, maxTextWidth), marginLeft, 80);
          doc.setFont('helvetica', 'bold');
          doc.text(doc.splitTextToSize(jsonObject.file_certificadoATIB, maxTextWidth), marginLeft + 5, 88);
        }

        // 6. DECLARO
        const declaro_titTextWidth = doc.getTextWidth(jsonObject.declaro);

        doc.text(jsonObject.declaro, (pageWidth - declaro_titTextWidth) / 2, 101);
        printBorder(doc, jsonObject.declaro, marginLeft, 100, fontSize, pageWidth)

        doc.setFont('helvetica', 'bold')
        doc.text(doc.splitTextToSize(jsonObject.declaracion_responsable_ils, maxTextWidth), marginLeft + 5, 110);
        doc.text(doc.splitTextToSize(jsonObject.declaracion_responsable_v_ils, maxTextWidth), marginLeft + 5, 114);
        if (this.actualLang === "es-ES") {
          doc.text(doc.splitTextToSize(jsonObject.declaracion_responsable_vii_ils, maxTextWidth), marginLeft + 5, 121);
          doc.text(doc.splitTextToSize(jsonObject.datos_consignados, maxTextWidth), marginLeft + 5, 125);
        } else {
          doc.text(doc.splitTextToSize(jsonObject.declaracion_responsable_vii_ils, maxTextWidth), marginLeft + 5, 118);
          doc.text(doc.splitTextToSize(jsonObject.datos_consignados, maxTextWidth), marginLeft + 5, 122);
        }

        // 7. SOLICITO
        const solicito_titTextWidth = doc.getTextWidth(jsonObject.solicito_cabecera_ils);

        doc.setFont('helvetica', 'normal');
        doc.text(jsonObject.solicito_cabecera_ils, (pageWidth - solicito_titTextWidth) / 2, 145);

        printBorder(doc, jsonObject.solicito_cabecera_ils, marginLeft, 144, fontSize, pageWidth);

        doc.text(doc.splitTextToSize(jsonObject.expongo_ils, maxTextWidth), marginLeft, 154);
        doc.setFont('helvetica', 'bold');
        doc.text(doc.splitTextToSize(jsonObject.solicito_ils, maxTextWidth), marginLeft + 5, 158);

        // Tercera página
        doc.addPage();
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        lines.forEach((line, index) => {
          const y = pageHeight - 10 - (index * lineHeight);
          doc.text(line, marginLeft, y);
        })

        doc.addImage("../../../assets/images/logoVertical.png", 'PNG', marginLeft, 20, 17, 22);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fontSize);
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
        doc.setFont('helvetica', 'normal')
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.text(`${i}/${totalPages}`, pageWidth - 20, pageHeight - 10);
        }

        const pdfBlob = doc.output('blob');

        const formData = new FormData();
        const fileName = `${data.nif}_declaracion_responsable_ils.pdf`;
        formData.append('file', pdfBlob, fileName);
        formData.append('id_sol', String(data.id_sol));
        formData.append('convocatoria', String(data.convocatoria));
        formData.append('nifcif_propietario', String(data.nif));
        formData.append('timeStamp', String(data.selloDeTiempo));

        this.actoAdminService.sendDecRespSolPDFToBackEnd(formData).subscribe({
          next: (response) => {
            this.docGenerado.id_sol = data.id_sol;
            this.docGenerado.cifnif_propietario = data.nif;
            this.docGenerado.convocatoria = String(data.convocatoria);
            this.docGenerado.name = 'doc_declaracion_responsable_ils.pdf';
            this.docGenerado.type = 'application/pdf';
            this.docGenerado.created_at = response.path;
            this.docGenerado.tipo_tramite = data.tipo_tramite;
            this.docGenerado.corresponde_documento = 'doc_declaracion_responsable_ils';
            this.docGenerado.selloDeTiempo = data.selloDeTiempo;

            this.nameDocGenerado = 'doc_declaracion_responsable_ils.pdf';

            this.insertDeclaracionResponsable(data);
          }
        })

      })
  }

  insertDeclaracionResponsable(data: any): void {
    this.documentoGeneradoService.create(this.docGenerado)
      .subscribe({
        next: (resp: any) => {
          this.lastInsertId = resp?.id;
          if (this.lastInsertId) {
            this.expedienteService
              .updateDocFieldExpediente(data.id_sol, 'doc_declaracion_responsable_ils', String(this.lastInsertId))
              .subscribe({
                next: (response: any) => {
                  const mensaje = response?.message || '✅ Declaración generada y subida';
                  this.commonService.showSnackBar(mensaje);
                  this.sendUserToSign(data, this.nameDocGenerado, this.lastInsertId)
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

  // Cambio de custom-validator según tipo solicitante
  changeNIFValidator(): void {
    const tipo_solicitanteValue = this.ilsForm.get('tipo_solicitante')?.value
    const applicantNif = this.ilsForm.get('nif')

    const nifValidators = [Validators.required, Validators.minLength(9), Validators.maxLength(9)]

    if (tipo_solicitanteValue === "autonomo") {
      this.businessType = "autonomo"
      nifValidators.push(this.customValidator.dniNieValidator())
    } else {
      this.businessType = "otros"
      nifValidators.push(this.customValidator.cifValidator())
    }

    applicantNif?.reset('')

    applicantNif?.setValidators(nifValidators)
    applicantNif?.updateValueAndValidity()
    applicantNif?.enable()
  }

  private loadZipcodes(): void {
    this.commonService.getZipCodes().subscribe((zipcodes: ZipCodesIBDTO[]) => {
      const filteredZipcodes: ZipCodesIBDTO[] = zipcodes.filter((zipcode: ZipCodesIBDTO) => zipcode.deleted_at?.toString() === "0000-00-00 00:00:00")
      this.zipCodeList = filteredZipcodes
      this.options = filteredZipcodes
    }, error => {
      this.showSnackBar(error)
    })
  }

  private loadActividadesCNAE(): void {
    this.commonService.getCNAEs().subscribe((actividadesCNAE: CnaeDTO[]) => {
      this.actividadesCNAE = actividadesCNAE
    }, error => { this.showSnackBar(error) })
  }

  // Coge el último id, le suma uno y lo asigna a idExp para la subida de datos.
  private generateIdExp(): void {
    this.expedienteService.getLastExpedienteIdByProgram('ILS').subscribe((id: any) => {
      this.idExp = (+id.last_id + 1).toString()
    }, error => { this.showSnackBar(error) })
  }

  setStep(index: number) {
    this.step.set(index)
  }

  // Limpieza espacios en blanco
  cleanBlank(event: any) {
    const inputElement = (event.target as HTMLInputElement)
    inputElement.value = inputElement.value.replace(/\s+/g, '')
  }

  selectedValue() {
    this.ilsForm.get('localidad')?.setValue(this.ilsForm.get('cpostal')?.value['town'])
  }

  displayFn(zpCode: ZipCodesIBDTO): string {
    return zpCode && zpCode.zipCode ? zpCode.zipCode : '';
  }

  private _filter(name: string): ZipCodesIBDTO[] {
    const filterValue = name;
    return this.options.filter((option) => option.zipCode.includes(filterValue))
  }

  private showSnackBar(error: string): void {
    this.snackBar.open(error, 'Close', {
      duration: 10000,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
      panelClass: ['custom-snackbar'],
    });
  }
}
