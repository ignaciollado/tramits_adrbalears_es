import { CommonModule, formatDate } from '@angular/common';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { Component, inject, signal, viewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
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
import { TranslateModule } from '@ngx-translate/core';
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
    MatAccordion, MatCheckboxModule, TranslateModule, MatTooltipModule, MatAutocompleteModule,
    MatRadioModule, MatIconModule, MatDialogModule],
  templateUrl: './grant-application-form.component.html',
  styleUrl: './grant-application-form.component.scss'
})
export class IsbaGrantApplicationFormComponent {
  readonly dialog = inject(MatDialog)
  step = signal(0)
  uploadProgress: number = 0
  isbaForm: FormGroup
  rgpdAccepted = false
  businessType: string = "";
  ayudasSubvenciones: boolean = true // Checkbox 5ª declaración responsable. En caso de false, debe enumerar las subvenciones
  dni_no_consent: boolean = false // Checkbox consentimiento en DNI/NIE
  atib_no_consent: boolean = false // Checkbox consentimiento en ATIB
  isSubsidyGreater: boolean = false

  // 10 MB máximos
  maxFileSizeBytes: number = 10 * 1024 * 1024

  zipCodeList: ZipCodesIBDTO[] = []
  options: ZipCodesIBDTO[] = []
  filteredOptions: Observable<ZipCodesIBDTO[]> | undefined
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

  accordion = viewChild.required(MatAccordion)
  constructor(private commonService: CommonService, private expedienteService: ExpedienteService,
    private documentosExpedienteService: ExpedienteDocumentoService,
    private documentService: DocumentService, private customValidator: CustomValidatorsService,
    private fb: FormBuilder, private snackBar: MatSnackBar, private actoAdminService: ActoAdministrativoService,
    private viafirmaService: ViafirmaService, private documentoGeneradoService: DocumentosGeneradosService) {
    this.isbaForm = this.fb.group({
      acceptRGPD: this.fb.control<boolean | null>(false, [Validators.required]),
      fecha_completado: this.fb.control(this.commonService.getCurrentDateTime()),

      tipo_solicitante: this.fb.control<string>('', [Validators.required]),
      nif: this.fb.control<string>({ value: '', disabled: true }, []), // Los validadores se setean posteriormente de forma dinámica,
      empresa: this.fb.control<string>('', [Validators.required, customValidator.xssProtectorValidator()]),
      domicilio: this.fb.control<string>('', [Validators.required, customValidator.xssProtectorValidator()]),
      cpostal: this.fb.control<string>('', [Validators.required, Validators.minLength(5), Validators.maxLength(5)]),
      localidad: this.fb.control<string>({ value: '', disabled: true }),
      telefono: this.fb.control<string>('', [Validators.required, Validators.pattern('[0-9]{9}'), Validators.minLength(9), Validators.maxLength(9)]),
      iae: this.fb.control<string>('', [Validators.required]),
      // Seteo sus validadores y sus enables/disables en base a business_type
      nombre_rep: this.fb.control<string>({ value: '', disabled: true }, []), // La protección de xss se añade posteriormente
      nif_rep: this.fb.control<string>({ value: '', disabled: true }, []),
      telefono_contacto_rep: this.fb.control<string>({ value: '', disabled: true }, []),

      telefono_rep: this.fb.control<string>('', [Validators.required, Validators.maxLength(9), Validators.minLength(9), Validators.pattern('[0-9]{9}')]),
      email_rep: this.fb.control<string>('', [Validators.required, Validators.email]),

      nom_entidad: this.fb.control<string>('', [Validators.required, customValidator.xssProtectorValidator()]),
      importe_prestamo: this.fb.control<string>('', [Validators.required, this.twoDecimalValidator()]),
      plazo_prestamo: this.fb.control<string>('', [Validators.required]),
      fecha_aval_idi_isba: this.fb.control<string>('', [Validators.required]),
      plazo_aval_idi_isba: this.fb.control<string>('', [Validators.required]),
      cuantia_aval_idi_isba: this.fb.control<string>('', [Validators.required, this.twoDecimalValidator()]),

      finalidad_inversion_idi_isba: this.fb.control<string>('', [Validators.required, customValidator.xssProtectorValidator()]),
      empresa_eco_idi_isba: this.fb.control<string>('', [Validators.required]),
      importe_presupuesto_idi_isba: this.fb.control<string>('', [Validators.required, this.twoDecimalValidator()]),
      intereses_ayuda_solicita_idi_isba: this.fb.control<string>('', [Validators.required, this.twoDecimalValidator()]),
      coste_aval_solicita_idi_isba: this.fb.control<string>('', [Validators.required, this.twoDecimalValidator()]),
      gastos_aval_solicita_idi_isba: this.fb.control<string>('', [Validators.required, this.twoDecimalValidator()]),
      importe_ayuda_solicita_idi_isba: this.fb.control<string>('', [Validators.required, this.twoDecimalValidator()]),

      declaro_idi_isba_que_cumple_0: this.fb.control<string>({ value: 'SI', disabled: true }, []),
      declaro_idi_isba_que_cumple_1: this.fb.control<string>({ value: 'SI', disabled: true }, []),
      declaro_idi_isba_que_cumple_2: this.fb.control<string>({ value: 'SI', disabled: true }, []),
      declaro_idi_isba_que_cumple_3: this.fb.control<string>({ value: 'SI', disabled: true }, []),
      declaro_idi_isba_que_cumple_4: this.fb.control<boolean>(true, []), // Interactuable.
      ayudasSubvenSICuales_dec_resp: this.fb.control<string>('', []),
      declaro_idi_isba_que_cumple_5: this.fb.control<string>({ value: 'SI', disabled: true }, []),
      declaro_idi_isba_que_cumple_7: this.fb.control<string>({ value: 'SI', disabled: true }, []),
      declaro_idi_isba_que_cumple_8: this.fb.control<string>({ value: 'SI', disabled: true }, []),
      declaro_idi_isba_que_cumple_10: this.fb.control<string>({ value: 'SI', disabled: true }, []),
      declaro_idi_isba_que_cumple_12: this.fb.control<string>({ value: 'SI', disabled: true }, []),
      declaro_idi_isba_que_cumple_13: this.fb.control<string>({ value: 'SI', disabled: true }, []),
      declaro_idi_isba_que_cumple_14: this.fb.control<string>({ value: 'SI', disabled: true }, []),
      declaro_idi_isba_que_cumple_15: this.fb.control<string>({ value: 'SI', disabled: true }, []),

      /* Documentación */
      file_memoriaTecnica: this.fb.control<File | null>(null, []),
      file_document_veracidad_datos_bancarios: this.fb.control<File | null>(null, []),
      file_certificadoIAE: this.fb.control<File | null>(null, []),
      file_altaAutonomos: this.fb.control<File | null>(null, []), // Persona física
      file_escrituraConstitucion: this.fb.control<File | null>(null, []), // Persona jurídica
      dni_no_consent: this.fb.control<boolean>(false, []),
      file_nifRepresentante: this.fb.control<File | null>(null, []), // DNI/NIE con consentimiento
      atib_no_consent: this.fb.control<boolean>(false, []),
      file_certificadoATIB: this.fb.control<File | null>(null, []), // Certificado ATIB y SS con consentimiento
      file_certificadoAEAT: this.fb.control<File | null>(null, []),
      file_certificadoLey382003: this.fb.control<File | null>(null, []), // Ayudas superiores a 30.000€
      file_certificadoSGR: this.fb.control<File | null>(null, []),
      file_contratoOperFinanc: this.fb.control<File | null>(null, []),
      file_avalOperFinanc: this.fb.control<File | null>(null, []),

      tipo_tramite: this.fb.control<string>('ADR-ISBA')
    })
  }

  ngOnInit(): void {
    // Desbloqueo por RGPD
    this.isbaForm.get('acceptRGPD')?.valueChanges.subscribe((value: boolean) => {
      this.rgpdAccepted = value
    })

    // Zipcode
    this.filteredOptions = this.isbaForm.get('cpostal')?.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value;
        return name ? this._filter(name as string) : this.options.slice();
      })
    )

    // Aparición/desaparición del campo 'ayudasSubvenSICuales_dec_resp' en base al 5º checkbox.
    this.isbaForm.get('declaro_idi_isba_que_cumple_4')?.valueChanges.subscribe((value: boolean) => {
      const ayudasSubvencionesNOControl = this.isbaForm.get('ayudasSubvenSICuales_dec_resp')
      const ayudasValidators = [this.customValidator.xssProtectorValidator()]
      ayudasSubvencionesNOControl?.reset('')

      if (value === false) {
        ayudasValidators.push(Validators.required)
      }

      this.ayudasSubvenciones = value
      ayudasSubvencionesNOControl?.setValidators(ayudasValidators)
      ayudasSubvencionesNOControl?.updateValueAndValidity()
    })

    // Aparición/desaparición del input file DNI/NIE
    this.isbaForm.get('dni_no_consent')?.valueChanges.subscribe((value: boolean) => {
      this.dni_no_consent = value;
    })

    // Aparición/desaparición del input file ATIB/Seg. Socia
    this.isbaForm.get('atib_no_consent')?.valueChanges.subscribe((value: boolean) => {
      this.atib_no_consent = value;
    })

    // BusinessType
    this.isbaForm.get('tipo_solicitante')?.valueChanges.subscribe(value => {
      this.onBusinessTypeChange();
    })


    this.loadZipcodes()
    this.loadActividadesCNAE()
    this.generateIdExp()
  }

  twoDecimalValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      const regex = /^\d+([.,]\d{2})$/;
      return value && !regex.test(value) ? { invalidDecimal: true } : null;
    };
  }

  /* DOCUMENTACIÓN */
  file_memoriaTecnicaToUpload: File[] = []                        // required   Descripción de la empresa y su actividad ...
  file_document_veracidad_datos_bancariosToUpload: File[] = []    // required   Declaración responsable veracidad datos bancarios ...
  file_certificadoIAEToUpload: File[] = []                        // required   Certificado del IAE actualizado en el ...
  /* Se se ha seleccionado Autónomo */
  file_altaAutonomosToUpload: File[] = []                         // OPT        Certificado de estar en el régimen especial de trabajadores autónomos ...
  /* Si se ha seleccionado Pequeña o mediana empresa */
  file_escrituraConstitucionToUpload: File[] = []                 // OPT        Documento persona jurídica

  file_nifRepresentanteToUpload: File[] = []                      // OPT        DNI/NIE de la persona solicitante y/o de la persona que la represente
  file_certificadoATIBToUpload: File[] = []                       // OPT        Certificado cumplimiento de las obligaciones tributarias de ATIB y Seguridad Social

  file_certificadoAEATToUpload: File[] = []                       // required   Certificado de estar al corriente de las obligaciones tributarias con la Agencia Estatal ...
  /* Si el importe de ayuda es igual o superior a 30.000 */
  file_certificadoLey382003ToUpload: File[] = []                  // OPT        Certificado que establece el artículo 13.3 bis de la Ley 38/2003 para ayudas superiores a 30.000€ ...
  file_certificadoSGRToUpload: File[] = []                        // required   El certificado de la sociedad de garantía recíproca que avale la operación financiera ...
  file_contratoOperFinancToUpload: File[] = []                    // required   Contrato de la operación financiera
  file_avalOperFinancToUpload: File[] = []                        // required   Contrato o documento de aval de la operación financiera

  onSubmit(): void {
    const timeStamp = this.commonService.generateCustomTimestamp();
    const convocatoria = new Date().getFullYear();
    const rawValues = this.isbaForm.getRawValue();
    
    rawValues.idExp = this.idExp;
    rawValues.selloDeTiempo = timeStamp;
    rawValues.convocatoria = convocatoria;
    rawValues.cpostal = this.isbaForm.get('cpostal')?.value['zipCode'];

    const filesToUpload = [
      { files: this.file_memoriaTecnicaToUpload, type: 'file_memoriaTecnica' },
      { files: this.file_document_veracidad_datos_bancariosToUpload, type: 'file_document_veracidad_datos_bancarios' },
      { files: this.file_certificadoIAEToUpload, type: 'file_certificadoIAE' },
      { files: this.file_certificadoAEATToUpload, type: 'file_certificadoAEAT' },
      { files: this.file_certificadoSGRToUpload, type: 'file_certificadoSGR' },
      { files: this.file_contratoOperFinancToUpload, type: 'file_contratoOperFinanc' },
      { files: this.file_avalOperFinancToUpload, type: 'file_avalOperFinanc' }
    ];

    const opcFilesToUpload = [
      { files: this.file_altaAutonomosToUpload, type: 'file_altaAutonomos' },
      { files: this.file_escrituraConstitucionToUpload, type: 'file_escrituraConstitucion' },
      { files: this.file_nifRepresentanteToUpload, type: 'file_nifRepresentante' },
      { files: this.file_certificadoATIBToUpload, type: 'file_certificadoATIB' },
      { files: this.file_certificadoLey382003ToUpload, type: 'file_certificadoLey382003' }
    ];

    this.expedienteService.createExpediente(rawValues).subscribe({
      next: (respuesta) => {
        rawValues.id_sol = respuesta.id_sol;
        this.showSnackBar('✔️ Expediente creado con éxito ' + respuesta.message + ' ' + respuesta.id_sol);

        this.generateDeclaracionResponsable(rawValues, filesToUpload, opcFilesToUpload);
        
        const archivosValidos = filesToUpload.flatMap(({ files, type }) => {
          if (!files || files.length === 0) return [];

          return Array.from(files).flatMap((file: File) => {
            if (!file) return [];
            if (file.size === 0) {
              this.showSnackBar(`⚠️ El archivo "${file.name}" está vacío y no se subirá.`);
              return [];
            }
            if (file.size > 10 * 1024 * 1024) {
              this.showSnackBar(`⚠️ El archivo "${file.name}" supera el tamaño máximo permitido de 10 MB.`);
              return [];
            }
            return [{ file, type }];
          });
        });

        const archivosOpcionalesValidos = opcFilesToUpload.flatMap(({ files, type }) => {
          if (!files || files.length === 0) return [];

          return Array.from(files).flatMap((file: File) => {
            if (!file || file.size === 0 || file.size > 10 * 1024 * 1024) return [];
            return [{ file, type }];
          });
        });

        const todosLosArchivos = [...archivosValidos, ...archivosOpcionalesValidos];

        if (todosLosArchivos.length === 0) {
          this.showSnackBar('⚠️ No hay archivos válidos para subir.');
          return;
        }

        from(todosLosArchivos).pipe(
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
                  mensaje += `🗂️ Archivo: ${file.name}\n📁 Ruta: ${file.path}\n`;
                });
              } else {
                mensaje += `⚠️ No se encontró información de archivo en el evento.`;
              }
              this.showSnackBar(mensaje);
            },
            complete: () => this.showSnackBar('✅ Todas las subidas finalizadas'),
            error: (err) => this.showSnackBar(`❌ Error durante la secuencia de subida: ${err}`)
          });
      },
      error: (err) => {
        let msg = '❌ Error al crear el expediente.\n';
        this.showSnackBar("err: " + err);
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
        this.showSnackBar(msg);
      }
    });
  }

  /* Documentos de subida obligada */
  get memoriaTecnicaFileNames(): string {
    return this.file_memoriaTecnicaToUpload.map(f => f.name).join(', ')
  }
  onFileMemoriaTecnicaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_memoriaTecnicaToUpload = Array.from(input.files);
    }
  }

  get document_veracidad_datos_bancariosFileNames(): string {
    return this.file_document_veracidad_datos_bancariosToUpload.map(f => f.name).join(', ')
  }
  onfile_document_veracidad_datos_bancariosChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_document_veracidad_datos_bancariosToUpload = Array.from(input.files);
    }
  }

  get file_certificadoIAEFileNames(): string {
    return this.file_certificadoIAEToUpload.map(f => f.name).join(', ')
  }
  onfile_certificadoIAEChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_certificadoIAEToUpload = Array.from(input.files);
    }
  }

  get file_nifRepresentanteFileNames(): string {
    return this.file_nifRepresentanteToUpload.map(f => f.name).join(', ')
  }
  onfile_nifRepresentanteChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_nifRepresentanteToUpload = Array.from(input.files);
    }
  }

  get file_certificadoATIBFileNames(): string {
    return this.file_certificadoATIBToUpload.map(f => f.name).join(', ')
  }
  onfile_certificadoATIBChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_certificadoATIBToUpload = Array.from(input.files);
    }
  }

  get file_certificadoAEATFileNames(): string {
    return this.file_certificadoAEATToUpload.map(f => f.name).join(', ')
  }
  onfile_certificadoAEATChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_certificadoAEATToUpload = Array.from(input.files);
    }
  }

  get file_certificadoSGRFileNames(): string {
    return this.file_certificadoSGRToUpload.map(f => f.name).join(', ')
  }
  onfile_certificadoSGRChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_certificadoSGRToUpload = Array.from(input.files);
    }
  }

  get file_contratoOperFinancFileNames(): string {
    return this.file_contratoOperFinancToUpload.map(f => f.name).join(', ')
  }
  onfile_contratoOperFinancChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_contratoOperFinancToUpload = Array.from(input.files);
    }
  }

  get file_avalOperFinancFileNames(): string {
    return this.file_avalOperFinancToUpload.map(f => f.name).join(', ')
  }
  onfile_avalOperFinancChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_avalOperFinancToUpload = Array.from(input.files);
    }
  }
  /* Documentos de subida opcional */
  get file_altaAutonomosFilesNames(): string {
    return this.file_altaAutonomosToUpload.map(f => f.name).join(', ')
  }
  onfile_altaAutonomosChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_altaAutonomosToUpload = Array.from(input.files);
    }
  }

  get file_escrituraConstitucionFileNames(): string {
    return this.file_escrituraConstitucionToUpload.map(f => f.name).join(', ')
  }
  onfile_escrituraConstitucionChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_escrituraConstitucionToUpload = Array.from(input.files)
    }
  }

  get file_certificadoLey382003FileNames(): string {
    return this.file_certificadoLey382003ToUpload.map(f => f.name).join(', ')
  }
  onfile_certificadoLey382003Change(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file_certificadoLey382003ToUpload = Array.from(input.files);
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


  /* Método que permite hacer lo siguiente tras seleccionar el tipo de empresa:
    - Cambia businessType a autonomo u otros
    - Setea los validadores correspondientes. En el caso del nif, aplicará de forma dinámica el validador de DNI/NIE o de CIF
    - Habilita/desactiva los campos de los representantes según si es autónomo u otros.
    - En caso de desactivar los campos de representante legal, se limpiará con reset('')
    - Para los documentos, seteará el validador 'Required'
  */
  onBusinessTypeChange(): void {
    const tipo_solicitante = this.isbaForm.get('tipo_solicitante')?.value

    const applicantNif = this.isbaForm.get('nif')
    const applicantNifValidators = [Validators.required, Validators.minLength(9), Validators.maxLength(9)]

    const repName = this.isbaForm.get('nombre_rep')
    const repNameValidators = [this.customValidator.xssProtectorValidator()]

    const repNif = this.isbaForm.get('nif_rep')
    const repNifValidators = [this.customValidator.dniNieValidator(), Validators.minLength(9), Validators.maxLength(9)]

    const repPhone = this.isbaForm.get('telefono_contacto_rep')
    const repPhoneValidators = [Validators.minLength(9), Validators.maxLength(9), Validators.pattern('[0-9]{9}')]

    if (tipo_solicitante === "autonomo") {
      this.businessType = "autonomo"
      applicantNifValidators.push(this.customValidator.dniNieValidator());

      [repName, repNif, repPhone].forEach(control => {
        control?.disable()
        control?.reset('')
      })
      this.file_escrituraConstitucionToUpload = [];
    } else {
      this.businessType = "otros"
      applicantNifValidators.push(this.customValidator.cifValidator());

      repNameValidators.push(Validators.required)
      repNifValidators.push(Validators.required)
      repPhoneValidators.push(Validators.required);

      [repName, repNif, repPhone].forEach(control => {
        control?.enable()
      })
      this.file_altaAutonomosToUpload = [];
    }

    applicantNif?.reset('')

    applicantNif?.setValidators(applicantNifValidators)
    repName?.setValidators(repNameValidators)
    repNif?.setValidators(repNifValidators)
    repPhone?.setValidators(repPhoneValidators);

    [applicantNif, repName, repNif, repPhone].forEach(control => control?.updateValueAndValidity())
    applicantNif?.enable()
  }

  // Checkea los 3 campos de subvenciones. Si el total de esos 3 no es igual al importe de presupuesto, lanzará error en los 3 campos
  checkTotalAmount(): void {
    const totalAmountControl = this.isbaForm.get('importe_presupuesto_idi_isba')

    const interestSubsidyControl = this.isbaForm.get('intereses_ayuda_solicita_idi_isba')
    const costSubsidyControl = this.isbaForm.get('coste_aval_solicita_idi_isba')
    const startStudySubsidyControl = this.isbaForm.get('gastos_aval_solicita_idi_isba')

    // Todos con valor
    if (
      totalAmountControl?.value != '' &&
      interestSubsidyControl?.value != '' &&
      costSubsidyControl?.value != '' &&
      startStudySubsidyControl?.value != ''
    ) {
      const subsidyTotal = (+interestSubsidyControl?.value + +costSubsidyControl?.value + +startStudySubsidyControl?.value).toFixed(2)
      const totalAmount = (+totalAmountControl?.value).toFixed(2)

      if (subsidyTotal !== totalAmount) {
        interestSubsidyControl?.setErrors({ ...interestSubsidyControl.errors, notEqualError: true })
        costSubsidyControl?.setErrors({ ...costSubsidyControl.errors, notEqualError: true })
        startStudySubsidyControl?.setErrors({ ...startStudySubsidyControl.errors, notEqualError: true })
      } else {
        [interestSubsidyControl, costSubsidyControl, startStudySubsidyControl].forEach(control => {
          const errors = { ...control?.errors };
          if (errors && errors['notEqualError']) {
            delete errors['notEqualError'];
            control?.setErrors(Object.keys(errors).length ? errors : null)
          }
        })
      }
    }
  }

  setStep(index: number): void {
    this.step.set(index)
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
    }, error => {
      this.showSnackBar(error)
    })
  }

  private generateIdExp(): void {
    this.expedienteService.getLastExpedienteIdByProgram('ADR-ISBA').subscribe((id: any) => {
      this.idExp = (+id.last_id + 1).toString()
    }, error => { this.showSnackBar(error) })
  }


  // Limpieza espacios en blanco
  cleanBlank(event: any): void {
    const inputElement = (event.target as HTMLInputElement)
    inputElement.value = inputElement.value.replace(/\s+/g, '')
  }

  // Comprobación del importe de ayuda solicitado: Si es mayor de 30.000, debe habilitarse un campo de documento
  checkAmount(): void {
    const importeSubvencionSolicitada = this.isbaForm.get('importe_ayuda_solicita_idi_isba')?.value;
    this.isSubsidyGreater = +importeSubvencionSolicitada > 30000 ? true : false
    if (!this.isSubsidyGreater) {
      this.file_certificadoLey382003ToUpload = [];
    }
  }

  selectedValue(): void {
    this.isbaForm.get('localidad')?.setValue(this.isbaForm.get('cpostal')?.value['town'])
  }

  displayFn(zpCode: ZipCodesIBDTO): string {
    return zpCode && zpCode.zipCode ? zpCode.zipCode : ''
  }

  private _filter(name: string): ZipCodesIBDTO[] {
    const filterValue = name;
    return this.options.filter((option) => option.zipCode.includes(filterValue))
  }

  uploadTheFile(timestamp: string, files: File[]): Observable<any> {
    if (!files || files.length === 0) {
      return of(null); // Devuelve observable vacío si no hay archivos
    }

    const formData = new FormData();
    const nif = this.isbaForm.value.nif;
    files.forEach(file => {
      formData.append('files[]', file);
    });
    console.log(files)

    return this.documentService.createDocument(nif, timestamp, formData).pipe(
      tap((event: HttpEvent<any>) => {
        switch (event.type) {
          case HttpEventType.Sent:
            this.showSnackBar('Archivos enviados al servidor...');
            break;
          case HttpEventType.UploadProgress:
            if (event.total) {
              this.uploadProgress = Math.round((100 * event.loaded) / event.total);
            }
            break;
          case HttpEventType.Response:
            this.showSnackBar('Archivos subidos con éxito: ' + event.body);
            this.uploadProgress = 100;
            break;
        }
      }),
      catchError(err => {
        this.showSnackBar('Error al subir los archivos: ' + err);
        return throwError(() => err);
      })
    );
  }

  private showSnackBar(error: string): void {
    this.snackBar.open(error, 'Close', {
      duration: 10000,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
      panelClass: ['custom-snackbar']
    })
  }


  // He decidido, para facilitar la subida, hacer que devuelva un File[]
  generateDeclaracionResponsable(data: any, reqFiles: any, opcFiles: any): void {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      floatPrecision: 16
    });

    doc.setProperties({
      title: `${data.nif}_${data.selloDeTiempo}_declaracion_responsable_idi_isba`,
      subject: 'Tràmits administratius',
      author: 'ADR Balears',
      keywords: 'INDUSTRIA 4.0, DIAGNÓSTIC, DIGITAL, EXPORTA, PIMES, ADR Balears, ISBA, GOIB"; "INDUSTRIA 4.0, DIAGNÓSTIC, DIGITAL, EXPORTA, PIMES, ADR Balears, ISBA, GOIB',
      creator: 'Angular App'
    });

    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxTextWidth = 170;

    const footerText = 'Agència de desenvolupament regional - Plaça Son Castelló 1 - Tel 971176161 - 07009 - Palma - Illes Balears';
    const marginLeft = 15;

    // Aplicar distintos estilos en una misma frase
    function printLabelWithBoldValue (doc: jsPDF, fullText: string, x: number, y: number, fontsize: number) {
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
    function printBorder (
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

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7)

    // Footer
    const footerTextWidth = doc.getTextWidth(footerText);
    const footerX = footerTextWidth < pageWidth ? (pageWidth - footerTextWidth) / 2 : 7;

    this.actoAdminService.getByNameAndTipoTramite('isba_20_declaracion_responsable_solicitud_ayuda', 'ADR-ISBA')
      .subscribe((docDataString: ActoAdministrativoDTO) => {
        let rawTexto = docDataString.texto;

        if (!rawTexto) {
          this.commonService.showSnackBar('❌ No se encontró el texto del acto administrativo.');
          return;
        }

        // Replace de datos
        /* Fechas formateadas */
        const formattedFecha_aval = formatDate(data?.fecha_aval_idi_isba, 'dd/MM/yyyy', 'es-ES');

        /* Importes monetarios formateados */
        const formattedImporte_operacion = this.commonService.formatCurrency(data.importe_prestamo);
        const formattedCuantia_aval = this.commonService.formatCurrency(data.cuantia_aval_idi_isba);
        const formattedImporte_presupuesto = this.commonService.formatCurrency(data.importe_presupuesto_idi_isba);
        const formattedImporte_ayuda = this.commonService.formatCurrency(data.importe_ayuda_solicita_idi_isba);
        const formattedImporte_intereses = this.commonService.formatCurrency(data.intereses_ayuda_solicita_idi_isba);
        const formattedImporte_aval = this.commonService.formatCurrency(data.coste_aval_solicita_idi_isba);
        const formattedImporte_estudio = this.commonService.formatCurrency(data.gastos_aval_solicita_idi_isba);

        rawTexto = rawTexto.replace(/%NOMBRE_RAZON_SOCIAL%/g, data.empresa);
        rawTexto = rawTexto.replace(/%NIF%/g, data.nif);
        rawTexto = rawTexto.replace(/%DOMICILIO%/g, data.domicilio);
        rawTexto = rawTexto.replace(/%ZIPCODE%/g, data.cpostal);
        rawTexto = rawTexto.replace(/%LOCALIDAD%/g, data.localidad);
        rawTexto = rawTexto.replace(/%NOMBRE_REPRESENTANTE_LEGAL%/g, data.nombre_rep);
        rawTexto = rawTexto.replace(/%DNI_REPRESENTANTE_LEGAL%/g, data.nombre_rep);
        rawTexto = rawTexto.replace(/%TELEFONO_CONTACTO_SOLICITANTE%/g, data.telefono);

        rawTexto = rawTexto.replace(/%DIRECCION_ELECTRONICA_NOTIFICACIONES%/g, data.email_rep);
        rawTexto = rawTexto.replace(/%TELEFONO_MOVIL_NOTIFICACIONES%/g, data.telefono_rep);

        rawTexto = rawTexto.replace(/%ENTIDAD_FINANCIERA%/g, data.nom_entidad);
        rawTexto = rawTexto.replace(/%IMPORTE_OPERACION%/g, formattedImporte_operacion);
        rawTexto = rawTexto.replace(/%PLAZO_FINANCIERO%/g, data.plazo_prestamo);
        rawTexto = rawTexto.replace(/%FECHA_AVAL%/g, formattedFecha_aval);
        rawTexto = rawTexto.replace(/%PLAZO_ISBA%/g, data.plazo_aval_idi_isba);
        rawTexto = rawTexto.replace(/%CUANTIA_AVAL%/g, formattedCuantia_aval);

        rawTexto = rawTexto.replace(/%FINALIDAD_INVERSION%/g, data.finalidad_inversion_idi_isba);

        rawTexto = rawTexto.replace(/%EMPRESA_ADHERIDA_ILS%/g, data.empresa_eco_idi_isba);
        rawTexto = rawTexto.replace(/%IMPORTE_PRESUPUESTO%/g, formattedImporte_presupuesto);
        rawTexto = rawTexto.replace(/%IMPORTE_AYUDA%/g, formattedImporte_ayuda);
        rawTexto = rawTexto.replace(/%IMPORTE_INTERESES%/g, formattedImporte_intereses);
        rawTexto = rawTexto.replace(/%IMPORTE_AVAL%/g, formattedImporte_aval);
        rawTexto = rawTexto.replace(/%IMPORTE_ESTUDIO%/g, formattedImporte_estudio);
        rawTexto = rawTexto.replace(/%AYUDAS_RECIBIDAS%/g, data.ayudasSubvenSICuales_dec_resp)

        let jsonObject;

        // Limpieza de texto
        try {
          rawTexto = this.commonService.cleanRawText(rawTexto);
        } catch (error) {
          console.error('Error al parsear JSON: ', error);
        } finally {
          jsonObject = JSON.parse(rawTexto)
        }

        // Primera página
        doc.text(footerText, footerX, pageHeight - 7);
        doc.addImage("../../../assets/images/logo-adrbalears-ceae-byn.png", 'PNG', marginLeft, 20, 75, 15);

        // Información
        printLabelWithBoldValue(doc, jsonObject.destino, marginLeft, 60, 8)
        printLabelWithBoldValue(doc, jsonObject.emisor, marginLeft, 64, 8)
        printLabelWithBoldValue(doc, jsonObject.tramite, marginLeft, 68, 8)

        printBorder(doc, [
          jsonObject.destino, jsonObject.emisor, jsonObject.tramite
        ], marginLeft, 60, 8, pageWidth);

        // Encabezado centrado
        const identificacion_solicitante_tit = jsonObject.identificacion_solicitante_tit;
        const identificacionTextWidth = doc.getTextWidth(identificacion_solicitante_tit);

        // Identificación del solicitante
        doc.setFont('helvetica', 'normal');
        doc.text(identificacion_solicitante_tit, (pageWidth - identificacionTextWidth) / 2, 95)

        printBorder(doc, identificacion_solicitante_tit, marginLeft, 94, 8, pageWidth)
        printLabelWithBoldValue(doc, jsonObject.nombre, marginLeft, 104, 8)
        printLabelWithBoldValue(doc, jsonObject.nif, marginLeft, 108, 8)
        printLabelWithBoldValue(doc, jsonObject.domicilio, marginLeft, 112, 8)
        printLabelWithBoldValue(doc, jsonObject.localidad, marginLeft, 116, 8)
        printLabelWithBoldValue(doc, jsonObject.nombre_representante_legal, marginLeft, 120, 8)
        printLabelWithBoldValue(doc, jsonObject.dni_representante_legal, marginLeft, 124, 8)
        printLabelWithBoldValue(doc, jsonObject.telefono_contacto_solicitante, marginLeft, 128, 8)

        // Encabezado centrado
        const notificacion_tit = jsonObject.notificacion_tit;
        const notificacionTextWidth = doc.getTextWidth(notificacion_tit);

        // Notificación
        doc.setFont('helvetica', 'normal')
        doc.text(notificacion_tit, (pageWidth - notificacionTextWidth) / 2, 143);

        printBorder(doc, notificacion_tit, marginLeft, 142, 8, pageWidth);
        doc.text(jsonObject.notificacion_info, marginLeft, 152);

        printLabelWithBoldValue(doc, jsonObject.direccion_electrónica_a_efectos_de_notificaciones, marginLeft, 158, 8);
        printLabelWithBoldValue(doc, jsonObject.telefono_movil_a_efectos_de_notificaciones, marginLeft, 162, 8);

        // Datos de la operación Financiera
        doc.setFont('helvetica', 'normal');

        // Encabezado centrado
        const dat_op_financiera_tit = jsonObject.datos_operacion_financiera_tit;
        const dat_op_financiera_tit_long = jsonObject.datos_operacion_financiera_tit.split('\n')[0] // Cojo la primera frase (más larga) para centrar
        const datosFinancierosTextWidth = doc.getTextWidth(dat_op_financiera_tit_long)

        doc.text(dat_op_financiera_tit, (pageWidth - datosFinancierosTextWidth) / 2, 173);
        printBorder(doc, dat_op_financiera_tit, marginLeft, 172, 8, pageWidth);

        doc.setFont('helvetica', 'bold')
        doc.text(jsonObject.prestamo, marginLeft, 188);
        printLabelWithBoldValue(doc, jsonObject.entidad_financiera, marginLeft, 192, 8);
        printLabelWithBoldValue(doc, jsonObject.importe_operacion, marginLeft, 196, 8);
        printLabelWithBoldValue(doc, jsonObject.plazo_prestamo, marginLeft, 200, 8);

        doc.setFont('helvetica', 'bold')
        doc.text(jsonObject.aval_isba, marginLeft, 208);
        printLabelWithBoldValue(doc, jsonObject.fecha_formalizacion_aval, marginLeft, 212, 8);
        printLabelWithBoldValue(doc, jsonObject.plazo_aval, marginLeft, 216, 8);
        printLabelWithBoldValue(doc, jsonObject.cuantia_aval, marginLeft, 220, 8);

        // Proyecto de inversión
        const proyecto_inversion_tit = jsonObject.proyecto_inversion;
        const proyectoInversionTextWidth = doc.getTextWidth(proyecto_inversion_tit);

        // Encabezado centrado
        doc.setFont('helvetica', 'normal');
        doc.text(proyecto_inversion_tit, (pageWidth - proyectoInversionTextWidth) / 2, 233);
        printBorder(doc, proyecto_inversion_tit, marginLeft, 232, 8, pageWidth);

        printLabelWithBoldValue(doc, jsonObject.finalidad_inversion, marginLeft, 246, 8);


        // Segunda página
        doc.addPage();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7)
        doc.text(footerText, footerX, pageHeight - 7);

        doc.addImage("../../../assets/images/logoVertical.png", 'PNG', marginLeft, 20, 17, 22);

        // Presupuesto del proyecto de inversión
        const pres_proyecto_tit = jsonObject.presupuesto_proyecto;
        const presProyectoTextWidth = doc.getTextWidth(pres_proyecto_tit);

        // Encabezado centrado
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8)

        doc.text(pres_proyecto_tit, (pageWidth - presProyectoTextWidth) / 2, 57);
        printBorder(doc, pres_proyecto_tit, marginLeft, 56, 8, pageWidth);

        printLabelWithBoldValue(doc, jsonObject.empresa_adherida_ils, marginLeft, 70, 8);
        printLabelWithBoldValue(doc, jsonObject.importe_presupuesto, marginLeft, 74, 8);
        doc.setFont('helvetica', 'normal');
        doc.text(jsonObject.detalles_txt, marginLeft, 78);
        printLabelWithBoldValue(doc, jsonObject.detalle_importe_intereses, marginLeft + 5, 82, 8);
        printLabelWithBoldValue(doc, jsonObject.detalle_importe_coste, marginLeft + 5, 86, 8);
        printLabelWithBoldValue(doc, jsonObject.detalle_importe_estudios, marginLeft + 5, 90, 8);
        printLabelWithBoldValue(doc, jsonObject.importe_ayuda, marginLeft, 98, 8);

        // DECLARO
        const declaro_tit = jsonObject.declaro_tit;
        const declaroTextWidth = doc.getTextWidth(declaro_tit);

        doc.setFont('helvetica', 'normal');

        doc.text(declaro_tit, (pageWidth - declaroTextWidth) / 2, 111);
        printBorder(doc, declaro_tit, marginLeft, 110, 8, pageWidth);

        doc.text(doc.splitTextToSize(jsonObject.declaro_idi_isba_que_cumple_0_5, maxTextWidth), marginLeft + 5, 124);

        // PENDIENTE!
        if (!data.declaro_idi_isba_que_cumple_4) {
          printLabelWithBoldValue(doc, jsonObject.declaro_idi_isba_ayudas_recibidas, marginLeft + 10, 166, 8);
          doc.setFont('helvetica', 'normal');

          doc.text(doc.splitTextToSize(jsonObject.declaro_idi_isba_que_cumple_6_15, maxTextWidth), marginLeft + 5, 173);
        } else {
          doc.text(doc.splitTextToSize(jsonObject.declaro_idi_isba_que_cumple_6_15, maxTextWidth), marginLeft + 5, 166);
        }

        // Tercera página
        doc.addPage();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7)
        doc.text(footerText, footerX, pageHeight - 7);

        doc.addImage("../../../assets/images/logoVertical.png", 'PNG', marginLeft, 20, 17, 22);

        // Documentación adjunta
        const documentacion_adjunta_tit = jsonObject.documentacion_adjunta_tit;
        const documentacionTextWidth = doc.getTextWidth(documentacion_adjunta_tit);

        doc.setFontSize(8)
        doc.text(documentacion_adjunta_tit, (pageWidth - documentacionTextWidth) / 2, 57)
        printBorder(doc, documentacion_adjunta_tit, marginLeft, 56, 8, pageWidth);

        // Archivos adjuntados. Coge el type
        const filesList = [...reqFiles, ...opcFiles].filter(file => file.files.length !== 0)
          .map(file => file.type);

        let documentacionAdjuntaY = 70;

        for (let i = 0; i < filesList.length; i++) {
          const actualFile = filesList[i];
          const text = `${i + 1}. ${jsonObject[actualFile]}`;
          const lines = doc.splitTextToSize(text, maxTextWidth);

          doc.text(lines, marginLeft + 5, documentacionAdjuntaY);
          documentacionAdjuntaY += lines.length * (8 * 0.5); // 8 sale del propio fontSize. 0.5 sería el espaciado entre textos
        }

        // Cuarta página
        doc.addPage();
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(footerText, footerX, pageHeight - 7);

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

        const pdfBlob = doc.output('blob');

        const formData = new FormData();
        const fileName = `${data.nif}_declaracion_responsable_idi_isba.pdf`;
        formData.append('file', pdfBlob, fileName);
        formData.append('id_sol', String(data.id_sol));
        formData.append('convocatoria', String(data.convocatoria));
        formData.append('nifcif_propietario', String(data.nif));
        formData.append('timeStamp', String(data.selloDeTiempo));

        this.actoAdminService.sendPDFToBackEnd(formData).subscribe({
          next: (response) => {
            this.docGenerado.id_sol = data.id_sol;
            this.docGenerado.cifnif_propietario = data.nif;
            this.docGenerado.convocatoria = String(data.convocatoria);
            this.docGenerado.name = 'doc_declaracion_responsable_idi_isba.pdf';
            this.docGenerado.type = 'application/pdf';
            this.docGenerado.created_at = response.path;
            this.docGenerado.tipo_tramite = data.tipo_tramite;
            this.docGenerado.corresponde_documento = 'doc_declaracion_responsable_idi_isba';
            this.docGenerado.selloDeTiempo = data.selloDeTiempo;

            this.nameDocGenerado = 'doc_declaracion_responsable_idi_isba.pdf';

            this.insertDeclaracionResponsable(data);
          }
        })

      })
  }

  insertDeclaracionResponsable(data: any): void {
    this.documentoGeneradoService.create(this.docGenerado).subscribe({
      next: (resp: any) => {
        this.lastInsertId = resp?.id;
        if (this.lastInsertId) {
          this.expedienteService
          .updateDocFieldExpediente(data.id_sol, 'doc_declaracion_responsable_idi_isba', String(this.lastInsertId))
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
      last_insert_id: doc_id
    };

    this.viafirmaService.createSignatureRequest(payload)
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

}
