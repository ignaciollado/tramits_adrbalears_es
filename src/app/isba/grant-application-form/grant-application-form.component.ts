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
    MatAccordion, MatCheckboxModule, TranslateModule, MatTooltipModule, MatAutocompleteModule,
    MatRadioModule, MatIconModule, MatDialogModule],
  templateUrl: './grant-application-form.component.html',
  styleUrl: './grant-application-form.component.scss'
})
export class IsbaGrantApplicationFormComponent {
  readonly dialog = inject(MatDialog)
  step = signal(0)
  isbaForm: FormGroup
  rgpdAccepted = false
  businessType: string = "";
  ayudasSubvenciones: boolean = true // Checkbox 5ª declaración responsable. En caso de false, debe enumerar las subvenciones
  dni_no_consent: boolean = false // Checkbox consentimiento en DNI/NIE
  atib_no_consent: boolean = false // Checkbox consentimiento en ATIB
  isSubsidyGreater: boolean = false

  // Files

  // Nombres de archivos para printado en formulario
  fileNames: { [key: string]: string } = {
    file_memoriaTecnica: '',
    file_document_veracidad_datos_bancarios: '',
    file_certificadoIAE: '',
    file_altaAutonomos: '',
    file_escrituraConstitucion: '',
    file_nifRepresentante: '',
    file_certificadoATIB: '',
    file_certificadoAEAT: '',
    file_certificadoLey382003: '',
    file_certificadoSGR: '',
    file_contratoOperFinanc: '',
    file_avalOperFinanc: '',
  }

  // Archivos crudos para subir.
  files: { [key: string]: File[] } = {
    file_memoriaTecnica: [],
    file_document_veracidad_datos_bancarios: [],
    file_certificadoIAE: [],
    file_altaAutonomos: [],
    file_escrituraConstitucion: [],
    file_nifRepresentante: [],
    file_certificadoATIB: [],
    file_certificadoAEAT: [],
    file_certificadoLey382003: [],
    file_certificadoSGR: [],
    file_contratoOperFinanc: [],
    file_avalOperFinanc: [],
  }

  // Files obligatorios
  requiredFiles: string[] = [
    "file_memoriaTecnica",
    "file_document_veracidad_datos_bancarios",
    "file_certificadoIAE",
    "file_altaAutonomos",
    "file_escrituraConstitucion",
    "file_nifRepresentante",
    "file_certificadoATIB",
    "file_certificadoAEAT",
    "file_certificadoLey382003",
    "file_certificadoSGR",
    "file_contratoOperFinanc",
    "file_avalOperFinanc"
  ]

  // 10 MB máximos
  maxFileSizeBytes: number = 10 * 1024 * 1024

  zipCodeList: ZipCodesIBDTO[] = []
  options: ZipCodesIBDTO[] = []
  filteredOptions: Observable<ZipCodesIBDTO[]> | undefined
  actividadesCNAE: CnaeDTO[] = []

  idExp: string = ""

  accordion = viewChild.required(MatAccordion)
  constructor(private commonService: CommonService, private expedienteService: ExpedienteService, private documentService: DocumentService, private customValidator: CustomValidatorsService, private fb: FormBuilder, private snackBar: MatSnackBar) {
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
      importe_prestamo: this.fb.control<string>('', [Validators.required, Validators.pattern('^\\d+(\\.\\d{1,2})?$')]),
      plazo_prestamo: this.fb.control<string>('', [Validators.required]),
      fecha_aval_idi_isba: this.fb.control<string>('', [Validators.required]),
      plazo_aval_idi_isba: this.fb.control<string>('', [Validators.required]),
      cuantia_aval_idi_isba: this.fb.control<string>('', [Validators.required, Validators.pattern('^\\d+(\\.\\d{1,2})?$')]),

      finalidad_inversion_idi_isba: this.fb.control<string>('', [Validators.required, customValidator.xssProtectorValidator()]),
      empresa_eco_idi_isba: this.fb.control<string>('', [Validators.required]),
      importe_presupuesto_idi_isba: this.fb.control<string>('', [Validators.required, Validators.pattern('^\\d+(\\.\\d{1,2})?$')]),
      intereses_ayuda_solicita_idi_isba: this.fb.control<string>('', [Validators.required, Validators.pattern('^\\d+(\\.\\d{1,2})?$')]),
      coste_aval_solicita_idi_isba: this.fb.control<string>('', [Validators.required, Validators.pattern('^\\d+(\\.\\d{1,2})?$')]),
      gastos_aval_solicita_idi_isba: this.fb.control<string>('', [Validators.required, Validators.pattern('^\\d+(\\.\\d{1,2})?$')]),
      importe_ayuda_solicita_idi_isba: this.fb.control<string>('', [Validators.required, Validators.pattern('^\\d+(\\.\\d{1,2})?$')]),

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
      file_memoriaTecnica: this.fb.control<File | null>(null, [Validators.required]),
      file_document_veracidad_datos_bancarios: this.fb.control<File | null>(null, [Validators.required]),
      file_certificadoIAE: this.fb.control<File | null>(null, [Validators.required]),
      file_altaAutonomos: this.fb.control<File | null>(null, []), // Persona física
      file_escrituraConstitucion: this.fb.control<File | null>(null, []), // Persona jurídica
      dni_no_consent: this.fb.control<boolean>(false, []),
      file_nifRepresentante: this.fb.control<File | null>(null, []), // DNI/NIE con consentimiento
      atib_no_consent: this.fb.control<boolean>(false, []),
      file_certificadoATIB: this.fb.control<File | null>(null, []), // Certificado ATIB y SS con consentimiento
      file_certificadoAEAT: this.fb.control<File | null>(null, [Validators.required]),
      file_certificadoLey382003: this.fb.control<File | null>(null, []), // Ayudas superiores a 30.000€
      file_certificadoSGR: this.fb.control<File | null>(null, [Validators.required]),
      file_contratoOperFinanc: this.fb.control<File | null>(null, [Validators.required]),
      file_avalOperFinanc: this.fb.control<File | null>(null, [Validators.required]),

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
      this.docsCheckboxChanges('file_nifRepresentante', value, "dni_no_consent")
    })

    // Aparición/desaparición del input file ATIB/Seg. Socia
    this.isbaForm.get('atib_no_consent')?.valueChanges.subscribe((value: boolean) => {
      this.docsCheckboxChanges('file_certificadoATIB', value, 'atib_no_consent')
    })


    this.loadZipcodes()
    this.loadActividadesCNAE()
    this.generateIdExp()
  }

  onSubmit(): void {
    const customTimestamp = this.commonService.generateCustomTimestamp()
    const convocatoria = new Date().getFullYear()
    const cifnif_propietario = this.isbaForm.get('nif')?.value

    for (const [key, fileList] of Object.entries(this.files)) {
      if (fileList?.length != 0) {
        this.isbaForm.get(key)?.setValue('SI')
      } else {
        this.isbaForm.get(key)?.setValue('NO')
      }
    }

    const rawValues = this.isbaForm.getRawValue()
    // Añado datos necesarios
    rawValues.idExp = this.idExp
    rawValues.selloDeTiempo = customTimestamp
    rawValues.convocatoria = convocatoria
    rawValues.cpostal = this.isbaForm.get('cpostal')?.value['zipCode']

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
          documentFormData.append('tipo_tramite', 'ADR-ISBA')
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
      }
    }
  }

  /* Cambiado a fecha 30/06. Cambios:
    - Cambio totalmente la forma de guardado. Ahora se guarda el archivo entero en un objeto de clase llamado file y el nombre del archivo en un objeto llamado fileNames
    - Permito que se guarde correctamente habiendo más de un file para subir.
    - Ahora hay un listado de archivos preparados 
  */
  onFileChange(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement
    const controlNameForm = this.isbaForm.get(controlName)
    const inputFiles: File[] = []
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

    this.files[controlName] = inputFiles;
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

    const docsPersFis = this.isbaForm.get('file_altaAutonomos')
    const docsPersFisValidators = []

    const docsPersJur = this.isbaForm.get('file_escrituraConstitucion')
    const docsPersJurValidators = []

    if (tipo_solicitante === "autonomo") {
      this.businessType = "autonomo"
      applicantNifValidators.push(this.customValidator.dniNieValidator())
      docsPersFisValidators.push(Validators.required);

      [repName, repNif, repPhone].forEach(control => {
        control?.disable()
        control?.reset('')
      })
    } else {
      this.businessType = "otros"
      applicantNifValidators.push(this.customValidator.cifValidator())
      docsPersJurValidators.push(Validators.required)

      repNameValidators.push(Validators.required)
      repNifValidators.push(Validators.required)
      repPhoneValidators.push(Validators.required);

      [repName, repNif, repPhone].forEach(control => {
        control?.enable()
      })
    }

    applicantNif?.reset('')

    applicantNif?.setValidators(applicantNifValidators)
    repName?.setValidators(repNameValidators)
    repNif?.setValidators(repNifValidators)
    repPhone?.setValidators(repPhoneValidators)
    docsPersFis?.setValidators(docsPersFisValidators)
    docsPersJur?.setValidators(docsPersJurValidators);

    [applicantNif, repName, repNif, repPhone, docsPersFis, docsPersJur].forEach(control => control?.updateValueAndValidity())
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

      if (subsidyTotal != totalAmount) {
        interestSubsidyControl?.setErrors({ notEqualError: true })
        costSubsidyControl?.setErrors({ notEqualError: true })
        startStudySubsidyControl?.setErrors({ notEqualError: true })
      } else {
        interestSubsidyControl?.setErrors(null)
        costSubsidyControl?.setErrors(null)
        startStudySubsidyControl?.setErrors(null)
      }
    }
  }

  setStep(index: number): void {
    this.step.set(index)
  }

  private docsCheckboxChanges(docField: string, value: boolean, booleanName: string): void {
    const targetDoc = this.isbaForm.get(docField)
    const targetValidators = []

    if (value === true) {
      targetValidators.push(Validators.required)
    }

    targetDoc?.reset(null)
    targetDoc?.setValidators(targetValidators);

    (this as any)[booleanName] = value;

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
    const documentoSubvencionValidators = []
    const documentoSubvencion = this.isbaForm.get('file_certificadoLey382003')

    if (+importeSubvencionSolicitada > 30000) {
      documentoSubvencionValidators.push(Validators.required)
    }

    documentoSubvencion?.reset('')
    documentoSubvencion?.setValidators(documentoSubvencionValidators)

    documentoSubvencion?.updateValueAndValidity()

    this.isSubsidyGreater = +importeSubvencionSolicitada > 30000 ? true : false
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


  private showSnackBar(error: string): void {
    this.snackBar.open(error, 'Close', {
      duration: 10000,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
      panelClass: ['custom-snackbar']
    })
  }
}
