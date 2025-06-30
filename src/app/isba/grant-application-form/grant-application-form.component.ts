import { CommonModule } from '@angular/common';
import { Component, signal, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { map, Observable, startWith } from 'rxjs';
import { CnaeDTO } from '../../Models/cnae.dto';
import { ZipCodesIBDTO } from '../../Models/zip-codes-ib.dto';
import { CommonService } from '../../Services/common.service';
import { CustomValidatorsService } from '../../Services/custom-validators.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-grant-application-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatSelectModule, MatExpansionModule,
    MatAccordion, MatCheckboxModule, TranslateModule, MatTooltipModule, MatAutocompleteModule,
    MatRadioModule, MatIconModule],
  templateUrl: './grant-application-form.component.html',
  styleUrl: './grant-application-form.component.scss'
})
export class IsbaGrantApplicationFormComponent {
  step = signal(0)
  isbaForm: FormGroup
  rgpdAccepted = false
  businessType: string = "";
  businessTypeChoosed: boolean = false // Evitar problemas de validadores
  ayudasSubvenciones: boolean = true // Checkbox 5ª declaración responsable. En caso de false, debe enumerar las subvenciones
  dni_no_consent: boolean = false // Checkbox consentimiento en DNI/NIE
  atib_no_consent: boolean = false // Checkbox consentimiento en ATIB
  isSubsidyGreater: boolean = false

  // Files
  fileNames: { [key: string]: string } = {
    documentacion_adjunta_requerida_idi_isba_a: "",
    documentacion_adjunta_requerida_idi_isba_b: "",
    documentacion_adjunta_requerida_idi_isba_c: "",
    documentacion_adjunta_requerida_idi_isba_d: "",
    documentacion_adjunta_requerida_idi_isba_e: "",
    documentacion_adjunta_requerida_idi_isba_f: "",
    documentacion_adjunta_requerida_idi_isba_g: "",
    documentacion_adjunta_requerida_idi_isba_h: "",
    documentacion_adjunta_requerida_idi_isba_i: "",
    documentacion_adjunta_requerida_idi_isba_j: "",
    documentacion_adjunta_requerida_idi_isba_k: "",
    documentacion_adjunta_requerida_idi_isba_l: "",
    documentacion_adjunta_requerida_idi_isba_m: "",
    documentacion_adjunta_requerida_idi_isba_n: "",
  }

  // 10 MB máximos
  maxFileSizeBytes: number = 10 * 1024 * 1024

  zipCodeList: ZipCodesIBDTO[] = []
  options: ZipCodesIBDTO[] = []
  filteredOptions: Observable<ZipCodesIBDTO[]> | undefined
  actividadesCNAE: CnaeDTO[] = []


  accordion = viewChild.required(MatAccordion)
  constructor(private commonService: CommonService, private customValidator: CustomValidatorsService, private fb: FormBuilder, private snackBar: MatSnackBar) {
    this.isbaForm = this.fb.group({
      acceptRGPD: this.fb.control<boolean | null>(false, [Validators.required]),
      tipo_solicitante: this.fb.control<string>('', [Validators.required]),
      nif: this.fb.control<string>('', []), // Los validadores se setean posteriormente de forma dinámica,
      denom_interesado: this.fb.control<string>('', [Validators.required, customValidator.xssProtectorValidator()]),
      domicilio: this.fb.control<string>('', [Validators.required, customValidator.xssProtectorValidator()]),
      cpostal: this.fb.control<string>('', [Validators.required, Validators.minLength(5), Validators.maxLength(5)]),
      localidad: this.fb.control<string>({ value: '', disabled: true }),
      telefono_cont: this.fb.control<string>('', [Validators.required, Validators.pattern('[0-9]{9}'), Validators.minLength(9), Validators.maxLength(9)]),
      codigoIAE: this.fb.control<string>('', [Validators.required]),

      // Seteo sus validadores y sus enables/disables en base a business_type
      nom_representante: this.fb.control<string>({ value: '', disabled: true }, []), // La protección de xss se añade posteriormente
      nif_representante: this.fb.control<string>({ value: '', disabled: true }, []),
      telefono_contacto_rep: this.fb.control<string>({ value: '', disabled: true }, []),

      tel_representante: this.fb.control<string>('', [Validators.required, Validators.maxLength(9), Validators.minLength(9), Validators.pattern('[0-9]{9}')]),
      mail_representante: this.fb.control<string>('', [Validators.required, Validators.email]),
      nom_entidad: this.fb.control<string>('', [Validators.required, customValidator.xssProtectorValidator()]),
      importe_prestamo: this.fb.control<string>('', [Validators.required, Validators.pattern('^\\d+(\\.\\d{1,2})?$')]),
      plazo_prestamo: this.fb.control<string>('', [Validators.required]),
      fecha_aval_isba: this.fb.control<string>('', [Validators.required]),
      plazo_aval_isba: this.fb.control<string>('', [Validators.required]),
      cuantia_aval_isba: this.fb.control<string>('', [Validators.required, Validators.pattern('^\\d+(\\.\\d{1,2})?$')]),
      finalidad_inversion_idi_isba: this.fb.control<string>('', [Validators.required, customValidator.xssProtectorValidator()]),
      empresa_eco_idi_isba: this.fb.control<string>('', [Validators.required]),
      importe_presupuesto_idi_isba: this.fb.control<string>('', [Validators.required, Validators.pattern('^\\d+(\\.\\d{1,2})?$')]),
      intereses_ayuda_solicita_idi_isba: this.fb.control<string>('', [Validators.required, Validators.pattern('^\\d+(\\.\\d{1,2})?$')]),
      coste_aval_solicita_idi_isba: this.fb.control<string>('', [Validators.required, Validators.pattern('^\\d+(\\.\\d{1,2})?$')]),
      gastos_aval_solicita_idi_isba: this.fb.control<string>('', [Validators.required, Validators.pattern('^\\d+(\\.\\d{1,2})?$')]),
      importe_ayuda_solicita_idi_isba: this.fb.control<string>('', [Validators.required, Validators.pattern('^\\d+(\\.\\d{1,2})?$')]),
      declaro_idi_isba_que_cumple_0: this.fb.control<boolean>(true, []),
      declaro_idi_isba_que_cumple_1: this.fb.control<boolean>(true, []),
      declaro_idi_isba_que_cumple_2: this.fb.control<boolean>(true, []),
      declaro_idi_isba_que_cumple_3: this.fb.control<boolean>(true, []),
      declaro_idi_isba_que_cumple_4: this.fb.control<boolean>(true, []), // Interactuable.
      ayudasSubvenSICuales_dec_resp: this.fb.control<string>('', []),
      declaro_idi_isba_que_cumple_5: this.fb.control<boolean>(true, []),
      declaro_idi_isba_que_cumple_7: this.fb.control<boolean>(true, []),
      declaro_idi_isba_que_cumple_8: this.fb.control<boolean>(true, []),
      declaro_idi_isba_que_cumple_10: this.fb.control<boolean>(true, []),
      declaro_idi_isba_que_cumple_12: this.fb.control<boolean>(true, []),
      declaro_idi_isba_que_cumple_13: this.fb.control<boolean>(true, []),
      declaro_idi_isba_que_cumple_14: this.fb.control<boolean>(true, []),
      declaro_idi_isba_que_cumple_15: this.fb.control<boolean>(true, []),

      /* Documentación */
      documentacion_adjunta_requerida_idi_isba_a: this.fb.control<File | null>(null, []),
      documentacion_adjunta_requerida_idi_isba_b: this.fb.control<File | null>(null, [Validators.required]),
      documentacion_adjunta_requerida_idi_isba_c: this.fb.control<File | null>(null, [Validators.required]),
      documentacion_adjunta_requerida_idi_isba_d: this.fb.control<File | null>(null, [Validators.required]),
      documentacion_adjunta_requerida_idi_isba_e: this.fb.control<File | null>(null, []), // Persona física
      documentacion_adjunta_requerida_idi_isba_f: this.fb.control<File | null>(null, []), // Persona jurídica
      dni_no_consent: this.fb.control<boolean>(false, []),
      documentacion_adjunta_requerida_idi_isba_g: this.fb.control<File | null>(null, []), // DNI/NIE con consentimiento
      atib_no_consent: this.fb.control<boolean>(false, []),
      documentacion_adjunta_requerida_idi_isba_h: this.fb.control<File | null>(null, []), // Certificado ATIB y SS con consentimiento
      documentacion_adjunta_requerida_idi_isba_i: this.fb.control<File | null>(null, [Validators.required]),
      documentacion_adjunta_requerida_idi_isba_j: this.fb.control<File | null>(null, []), // Ayudas superiores a 30.000€
      documentacion_adjunta_requerida_idi_isba_k: this.fb.control<File | null>(null, [Validators.required]),
      documentacion_adjunta_requerida_idi_isba_l: this.fb.control<File | null>(null, [Validators.required]),
      documentacion_adjunta_requerida_idi_isba_m: this.fb.control<File | null>(null, [Validators.required]),
      documentacion_adjunta_requerida_idi_isba_n: this.fb.control<File | null>(null, []),

      tipo_tramite: this.fb.control<string>('ADR-ISBA')

    })
  }

  ngOnInit(): void {
    // Desbloqueo por RGPD
    this.isbaForm.get('acceptRGPD')?.valueChanges.subscribe((value: boolean) => {
      this.rgpdAccepted = value
    })

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
      this.docsCheckboxChanges('documentacion_adjunta_requerida_idi_isba_g', value, "dni_no_consent")
    })

    // Aparición/desaparición del input file ATIB/Seg. Socia
    this.isbaForm.get('atib_no_consent')?.valueChanges.subscribe((value: boolean) => {
      this.docsCheckboxChanges('documentacion_adjunta_requerida_idi_isba_h', value, 'atib_no_consent')
    })

    // Zipcode
    this.filteredOptions = this.isbaForm.get('cpostal')?.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value;
        return name ? this._filter(name as string) : this.options.slice();
      })
    )

    this.loadZipcodes()
    this.loadActividadesCNAE()

  }

  onSubmit(): void {
    console.log(this.isbaForm.value)
  }

  onFileChange(event: Event, controlName: string): void {
    const file = (event.target as HTMLInputElement).files?.[0]
    const controlNameForm = this.isbaForm.get(controlName)

    if (file) {
      controlNameForm?.setValue(file)
      if (file.size > this.maxFileSizeBytes) {
        controlNameForm?.setErrors({ invalidFile: true })
      }

      else {
        controlNameForm?.setErrors(null)
      }
      this.fileNames[controlName] = file.name
    }
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

    const repName = this.isbaForm.get('nom_representante')
    const repNameValidators = [this.customValidator.xssProtectorValidator()]

    const repNif = this.isbaForm.get('nif_representante')
    const repNifValidators = [this.customValidator.dniNieValidator(), Validators.minLength(9), Validators.maxLength(9)]

    const repPhone = this.isbaForm.get('telefono_contacto_rep')
    const repPhoneValidators = [Validators.minLength(9), Validators.maxLength(9), Validators.pattern('[0-9]{9}')]

    const docsPersFis = this.isbaForm.get('documentacion_adjunta_requerida_idi_isba_e')
    const docsPersFisValidators = []

    const docsPersJur = this.isbaForm.get('documentacion_adjunta_requerida_idi_isba_f')
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
    this.businessTypeChoosed = true
  }

  // Checkea los 3 campos de subvenciones. Si el total de esos 3 no es igual al importe de presupuesto, lanzará error en los 3 campos
  checkTotalAmount(): void {
    const totalAmountControl = this.isbaForm.get('importe_presupuesto_idi_isba')

    const interestSubsidyControl = this.isbaForm.get('intereses_ayuda_solicita_idi_isba')
    const costSubsidyControl = this.isbaForm.get('coste_aval_solicita_idi_isba')
    const startStudySubsidyControl = this.isbaForm.get('gastos_aval_solicita_idi_isba')

    // Todos con valor
    if (
      totalAmountControl?.value != null &&
      interestSubsidyControl?.value != null &&
      costSubsidyControl?.value != null &&
      startStudySubsidyControl?.value != null
    ) {
      const subsidyTotal = (+interestSubsidyControl?.value + +costSubsidyControl?.value + +startStudySubsidyControl?.value).toFixed(2)
      const totalAmount = (+totalAmountControl.value).toFixed(2)

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

  // Limpieza espacios en blanco
  cleanBlank(event: any): void {
    const inputElement = (event.target as HTMLInputElement)
    inputElement.value = inputElement.value.replace(/\s+/g, '')
  }

  // Comprobación del importe de ayuda solicitado: Si es mayor de 30.000, debe habilitarse un campo de documento
  checkAmount(): void {
    const importeSubvencionSolicitada = this.isbaForm.get('importe_ayuda_solicita_idi_isba')?.value;
    const documentoSubvencionValidators = []
    const documentoSubvencion = this.isbaForm.get('documentacion_adjunta_requerida_idi_isba_j')

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
