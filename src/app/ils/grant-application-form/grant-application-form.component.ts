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
import { map, Observable, startWith } from 'rxjs';
import { CnaeDTO } from '../../Models/cnae.dto';
import { ZipCodesIBDTO } from '../../Models/zip-codes-ib.dto';
import { PopUpDialogComponent } from '../../popup-dialog/popup-dialog.component';
import { CommonService } from '../../Services/common.service';
import { CustomValidatorsService } from '../../Services/custom-validators.service';
import { DocumentService } from '../../Services/document.service';
import { ExpedienteService } from '../../Services/expediente.service';


@Component({
  selector: 'app-grant-application-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatSelectModule, MatExpansionModule,
    MatAccordion, MatIconModule, MatCheckboxModule, MatRadioModule, TranslateModule, MatTooltipModule, MatAutocompleteModule, MatDialogModule],
  templateUrl: './grant-application-form.component.html',
  styleUrl: './grant-application-form.component.scss'
})

export class IlsGrantApplicationFormComponent {
  readonly dialog = inject(MatDialog)
  step = signal(0)
  ilsForm: FormGroup
  radioOptionDocs: string = ""
  rgpdAccepted = false
  businessType: string = "";

  // Files

  // Guardaré los nombres de los files aquí para su printado en el formulario y el listado de files
  fileNames: { [key: string]: string } = {
    file_enviardocumentoIdentificacion: "",
    file_certificadoATIB: "",
    file_escritura_empresa: "",
    file_certificadoIAE: "",
    file_informeResumenIls: "",
    file_informeInventarioIls: "",
    file_certificado_verificacion_ISO: "",
    file_modeloEjemploIls: "",
    file_certificado_itinerario_formativo: "",
    file_memoriaTecnica: "",
    file_nifEmpresa: "",
    file_logotipoEmpresaIls: ""
  }

  // Guardaré todos los files crudos aquí
  files: { [key: string]: File[] } = {
    file_enviardocumentoIdentificacion: [],
    file_certificadoATIB: [],
    file_escritura_empresa: [],
    file_certificadoIAE: [],
    file_informeResumenIls: [],
    file_informeInventarioIls: [],
    file_certificado_verificacion_ISO: [],
    file_modeloEjemploIls: [],
    file_certificado_itinerario_formativo: [],
    file_memoriaTecnica: [],
    file_nifEmpresa: [],
    file_logotipoEmpresaIls: []
  }

  // Files obligatorios
  requiredFiles: string[] = [
    'file_enviardocumentoIdentificacion',
    'file_certificadoATIB',
    'file_escritura_empresa',
    'file_certificadoIAE',
    'file_informeResumenIls',
    'file_informeInventarioIls',
    'file_certificado_verificacion_ISO',
    'file_modeloEjemploIls',
    'file_certificado_itinerario_formativo'
  ]

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
  constructor(private commonService: CommonService, private expedienteService: ExpedienteService, private documentService: DocumentService, private customValidator: CustomValidatorsService, private fb: FormBuilder, private snackBar: MatSnackBar) {
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
      file_enviardocumentoIdentificacion: this.fb.control<File | null>(null, []),
      checkboxATIB: this.fb.control<boolean>(true, []),
      file_certificadoATIB: this.fb.control<File | null>(null, []),

      cumpleRequisitos_dec_resp: this.fb.control<string>({ value: 'SI', disabled: true }, []),
      epigrafeIAE_dec_resp: this.fb.control<string>({ value: 'SI', disabled: true }, []),
      registroIndustrialMinero_dec_resp: this.fb.control<string>({ value: 'SI', disabled: true }, []),
      cumpleNormativaSegInd_dec_resp: this.fb.control<string>({ value: 'SI', disabled: true }, []),

      // Documentación
      file_escritura_empresa: this.fb.control<File | null>(null, [Validators.required]),
      file_certificadoIAE: this.fb.control<File | null>(null, [Validators.required]),
      radioGroupFile: this.fb.control(null, [Validators.required]),
      file_informeResumenIls: this.fb.control<File | null>(null, []), // Primera opción radio
      file_informeInventarioIls: this.fb.control<File | null>(null, []), // Primera opción radio
      file_certificado_verificacion_ISO: this.fb.control<File | null>(null, []), // Segunda opción radio
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

    // Validadores dinámicos con checkboxes (Autorizaciones)
    this.ilsForm.get('checkboxID')?.valueChanges.subscribe((value: boolean) => {
      this.applyConditionalValidator("checkboxID", "file_enviardocumentoIdentificacion", value)
    });

    this.ilsForm.get('checkboxATIB')?.valueChanges.subscribe((value: boolean) => {
      this.applyConditionalValidator('checkboxATIB', 'file_certificadoATIB', value)
    })

    // Validadores dinámicos con radio-buttons (Documentación requerida)
    this.ilsForm.get('radioGroupFile')?.valueChanges.subscribe((value: string) => {
      this.radioOptionDocs = value;
      this.applyRadioConditionalValidators(value)
    })

    this.loadZipcodes()
    this.loadActividadesCNAE()
    this.generateIdExp()
  }

  onSubmit(): void {
    const customTimestamp = this.commonService.generateCustomTimestamp()
    const convocatoria = new Date().getFullYear();
    const cifnif_propietario = this.ilsForm.get('nif')?.value

    for (const [key, fileList] of Object.entries(this.files)) {
      if (fileList?.length != 0) {
        this.ilsForm.get(key)?.setValue('SI')
      } else {
        this.ilsForm.get(key)?.setValue('NO')
      }
    }
    const rawValues = this.ilsForm.getRawValue()
    // Datos añadidos a los valores del formulario
    rawValues.idExp = this.idExp
    rawValues.selloDeTiempo = customTimestamp
    rawValues.convocatoria = convocatoria
    rawValues.cpostal = this.ilsForm.get('cpostal')?.value['zipCode']

    this.expedienteService.createExpediente(rawValues).subscribe({
      next: (respuesta) => {
        const newId = respuesta.id_sol
        this.uploadDocuments(newId, customTimestamp, convocatoria, cifnif_propietario)
      }, error: (error) => { this.showSnackBar(error) }
    })
  }

  // Subida de archivos en BBDD y servidor
  private uploadDocuments(id: number, customTimestamp: string, convocatoria: number, cifnif_propietario: string): void {
    for (const [key, fileList] of Object.entries(this.files)) {
      if (fileList.length != 0) {
        fileList.forEach(file => {
          /* BBDD */
          const documentFormData = new FormData()
          const requiredDoc = this.requiredFiles.includes(key) ? 'SI' : 'NO'

          documentFormData.append('id_sol', id.toString())
          documentFormData.append('cifnif_propietario', cifnif_propietario)
          documentFormData.append('convocatoria', convocatoria.toString())
          // documentFormData.append('name', file.name)
          // documentFormData.append('type', file.type)
          documentFormData.append('tipo_tramite', 'ILS')
          documentFormData.append('corresponde_documento', key)
          documentFormData.append('selloDeTiempo', customTimestamp)
          documentFormData.append('fase_exped', 'Solicitud')
          documentFormData.append('estado', 'Pendent')
          documentFormData.append('docRequerido', requiredDoc)
          // this.documentService.insertDocuments(documentFormData).subscribe({
          //   error: (error) => {
          //     this.showSnackBar(error)
          //   }
          // })

          /* Servidor */
          const serverDocumentFormData = new FormData()
          serverDocumentFormData.append('files', file)
          // this.documentService.createDocument(cifnif_propietario, customTimestamp, serverDocumentFormData).subscribe({
          //   error: (error) => {
          //     this.showSnackBar(error)
          //   }
          // })
        })
      };
    }
  }

  onFileChange(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement
    const controlNameForm = this.ilsForm.get(controlName)
    const inputFiles: File[] = [];
    const inputFilesNames: string[] = []

    controlNameForm?.setErrors(null)

    if (input.files) {
      for (let index = 0; index < input.files.length; index++) {
        const file = input.files.item(index)
        if (file) {
          if (file.size > this.maxFileSizeBytes) {
            controlNameForm?.setErrors({ invalidFile: true })
          }
          inputFiles.push(file)
          inputFilesNames.push(file.name)
        }
      }
    }

    this.files[controlName] = inputFiles
    this.fileNames[controlName] = inputFilesNames.join(', ')
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

  // Validador con checkboxes
  private applyConditionalValidator(checkboxName: string, fileControlName: string, checked: boolean): void {
    const fileControl = this.ilsForm.get(fileControlName)

    if (checked === false) {
      fileControl?.setValidators([Validators.required])
    } else {
      fileControl?.clearValidators();
      fileControl?.setValue(null)
    }

    checkboxName === "checkboxID" ? this.checkboxID = checked : this.checkboxATIB = checked

    fileControl?.updateValueAndValidity();
  }

  // Validador con radio
  private applyRadioConditionalValidators(option: string): void {
    const isOption1 = option === 'option1';

    const option1Fields = ['file_informeResumenIls', 'file_informeInventarioIls'];
    const option2Fields = ['file_certificado_verificacion_ISO'];

    option1Fields.forEach(field => {
      const control = this.ilsForm.get(field)
      control?.setValidators(isOption1 ? Validators.required : null);
      control?.setValue(isOption1 ? control?.value : null);
      control?.updateValueAndValidity();
    });

    option2Fields.forEach(field => {
      const control = this.ilsForm.get(field)
      control?.setValidators(isOption1 ? null : Validators.required);
      control?.setValue(isOption1 ? null : control?.value);
      control?.updateValueAndValidity();
    });
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
