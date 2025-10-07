import { CommonModule } from '@angular/common';
import { Component, inject, signal, viewChild } from '@angular/core';
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
import { TranslateModule } from '@ngx-translate/core';
import { catchError, concatMap, from, map, Observable, of, startWith, tap, throwError } from 'rxjs';
import { CnaeDTO } from '../../Models/cnae.dto';
import { ZipCodesIBDTO } from '../../Models/zip-codes-ib.dto';
import { PopUpDialogComponent } from '../../popup-dialog/popup-dialog.component';
import { CommonService } from '../../Services/common.service';
import { CustomValidatorsService } from '../../Services/custom-validators.service';
import { DocumentService } from '../../Services/document.service';
import { ExpedienteService } from '../../Services/expediente.service';
import { ExpedienteDocumentoService } from '../../Services/expediente.documento.service';
import { HttpEvent, HttpEventType } from '@angular/common/http';


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


  accordion = viewChild.required(MatAccordion)
  constructor(private commonService: CommonService, private expedienteService: ExpedienteService,
    private documentService: DocumentService,
    private documentosExpedienteService: ExpedienteDocumentoService,
    private customValidator: CustomValidatorsService, private fb: FormBuilder,
    private snackBar: MatSnackBar) {
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
      file_enviardocumentoIdentificacion: this.fb.control<File | null>({value: null, disabled: true}, [Validators.required]),
      checkboxATIB: this.fb.control<boolean>(true, []),
      file_certificadoATIB: this.fb.control<File | null>({value: null, disabled: true}, [Validators.required]),

      cumpleRequisitos_dec_resp: this.fb.control<string>({ value: 'SI', disabled: true }, []),
      epigrafeIAE_dec_resp: this.fb.control<string>({ value: 'SI', disabled: true }, []),
      registroIndustrialMinero_dec_resp: this.fb.control<string>({ value: 'SI', disabled: true }, []),
      cumpleNormativaSegInd_dec_resp: this.fb.control<string>({ value: 'SI', disabled: true }, []),

      // Documentación
      file_escritura_empresa: this.fb.control<File | null>(null, [Validators.required]),
      file_certificadoIAE: this.fb.control<File | null>(null, [Validators.required]),
      radioGroupFile: this.fb.control(null, []),
      file_informeResumenIls: this.fb.control<File | null>({value: null, disabled: true}, []), // Primera opción radio
      file_informeInventarioIls: this.fb.control<File | null>({value: null, disabled: true}, []), // Primera opción radio
      file_certificado_verificacion_ISO: this.fb.control<File | null>({value: null, disabled: true}, []), // Segunda opción radio
      file_modeloEjemploIls: this.fb.control<File | null>(null, [Validators.required]),
      file_certificado_itinerario_formativo: this.fb.control<File | null>(null, [Validators.required]),

      file_memoriaTecnica: this.fb.control<File | null>(null, []),
      file_nifEmpresa: this.fb.control<File | null>(null, []),
      file_logotipoEmpresaIls: this.fb.control<File | null>(null, []),

      tipo_tramite: this.fb.control<string>('ILS', []),
    })
  }

  ngOnInit(): void {
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
