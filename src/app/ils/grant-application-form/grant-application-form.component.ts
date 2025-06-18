import { CommonModule } from '@angular/common';
import { Component, signal, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { map, Observable, startWith } from 'rxjs';
import { ZipCodesIBDTO } from '../../Models/zip-codes-ib.dto';
import { CommonService } from '../../Services/common.service';
import { CustomValidatorsService } from '../../Services/custom-validators.service';
import { DataService } from '../../Services/data.service';


@Component({
  selector: 'app-grant-application-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatSelectModule, MatExpansionModule,
    MatAccordion, MatIconModule, MatCheckboxModule, MatRadioModule, TranslateModule, MatTooltipModule, MatAutocompleteModule],
  templateUrl: './grant-application-form.component.html',
  styleUrl: './grant-application-form.component.scss'
})

export class IlsGrantApplicationFormComponent {
  step = signal(0)
  ilsForm: FormGroup
  radioOptionDocs: string = ""
  rgpdAccepted = false
  businessType: string = "";
  businessTypeChoosed: boolean = false // Para evitar problemas de validadores customs

  // Files
  fileNames: { [key: string]: string } = {
    file_enviardocumentoIdentificacion: "",
    file_certificadoATIB: "",
    file_escritura_empresa: "",
    file_certificado_IAE: "",
    file_informeResumenIls: "",
    file_informeInventarioIls: "",
    file_certificado_verificacion_ISO: "",
    file_modeloEjemploIls: "",
    file_certificado_itinerario_formativo: "",
    file_memoriaTecnica: "",
    file_nifEmpresa: "",
    file_logotipoEmpresaIls: ""
  }
  // 10 MB máximos
  maxFileSizeBytes: number = 10 * 1024 * 1024

  // Checkboxes
  checkboxID: boolean = true
  checkboxATIB: boolean = true

  // Datos externos
  zipCodeList: ZipCodesIBDTO[] = []
  options: ZipCodesIBDTO[] = []
  filteredOptions: Observable<ZipCodesIBDTO[]> | undefined;
  epigrafesIAE: any[] = []


  accordion = viewChild.required(MatAccordion)
  constructor(private dataService: DataService, private commonService: CommonService , private customValidator: CustomValidatorsService, private fb: FormBuilder) {
    this.ilsForm = this.fb.group({
      acceptRGPD: this.fb.control<boolean | null>(false, Validators.required),
      tipo_solicitante: this.fb.control<string>('', Validators.required),
      nif: this.fb.control<string>(''), // Validadores seteados posteriormente
      denom_interesado: this.fb.control<string>('', Validators.required),
      domicilio: this.fb.control<string>('', Validators.required),
      cpostal: this.fb.control<string>('', [Validators.required, Validators.minLength(5), Validators.maxLength(5)]),
      localidad: this.fb.control<string>({ value: '', disabled: true }),
      tel_cont: this.fb.control<string>('', [Validators.required, Validators.pattern('[0-9]{9}'), Validators.maxLength(9), Validators.minLength(9)]),
      codigoIAE: this.fb.control<any>('', [Validators.required]),
      sitio_web_empresa: this.fb.control<string>('', []),
      video_empresa: this.fb.control<string>('', []),
      nom_representante: this.fb.control<string>('', [Validators.required]),
      nif_representante: this.fb.control<string>('', [Validators.required, Validators.minLength(9), Validators.maxLength(9), this.customValidator.dniNieValidator()]),
      tel_representante: this.fb.control<string>('', [Validators.required, Validators.pattern('[0-9]{9}'), Validators.maxLength(9)]),
      mail_representante: this.fb.control<string>('', [Validators.required, Validators.email]),

      checkboxID: this.fb.control<boolean>(true),
      file_enviardocumentoIdentificacion: this.fb.control<File | null>(null),
      checkboxATIB: this.fb.control<boolean>(true),
      file_certificadoATIB: this.fb.control<File | null>(null),

      declaracion_responsable_i: this.fb.control<boolean>(true),
      declaracion_responsable_v: this.fb.control<boolean>(true),
      declaracion_responsable_vii: this.fb.control<boolean>(true),
      declaracion_responsable_ix: this.fb.control<boolean>(true),

      // Documentación
      file_escritura_empresa: this.fb.control<File | null>(null, [Validators.required]),
      file_certificado_IAE: this.fb.control<File | null>(null, [Validators.required]),
      radioGroupFile: this.fb.control(null, [Validators.required]),
      file_informeResumenIls: this.fb.control<File | null>(null), // Primera opción radio
      file_informeInventarioIls: this.fb.control<File | null>(null), // Primera opción radio
      file_certificado_verificacion_ISO: this.fb.control<File | null>(null), // Segunda opción radio

      file_modeloEjemploIls: this.fb.control<File | null>(null, [Validators.required]),
      file_certificado_itinerario_formativo: this.fb.control<File | null>(null, [Validators.required]),
      file_memoriaTecnica: this.fb.control<File | null>(null),
      file_nifEmpresa: this.fb.control<File | null>(null),
      file_logotipoEmpresaIls: this.fb.control<File | null>(null)

    })

    this.dataService.getAllMockIAE().subscribe((epigrafesIAE: any[]) => {
      this.epigrafesIAE = epigrafesIAE
    })

  }

  ngOnInit(): void {
    // Desbloqueo por RGPD
    this.ilsForm.get('acceptRGPD')?.valueChanges.subscribe((value: boolean) => {
      this.rgpdAccepted = value
      if (value) {
        this.setStep(1)
      }
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
  }

  onSubmit(): void {
    console.log(this.ilsForm.value)
  }

  // Subida individual de archivo.
  onFileChange(event: Event, controlName: string): void {
    const file = (event.target as HTMLInputElement).files?.[0]
    const controlNameForm = this.ilsForm.get(controlName)

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

  // Cambio de custom-validator según tipo solicitante
  changeNIFValidator(): void {
    const nifControl = this.ilsForm.get('nif')
    const tipo_solicitanteValue = this.ilsForm.get('tipo_solicitante')?.value

    const nifValidators = [Validators.required, Validators.minLength(9), Validators.maxLength(9)]

    if (tipo_solicitanteValue === "autonomo") {
      this.businessType = "autonomo"
      nifValidators.push(this.customValidator.dniNieValidator())
    } else {
      this.businessType = "otros"
      nifValidators.push(this.customValidator.cifValidator())
    }

    nifControl?.setValidators(nifValidators)
    nifControl?.updateValueAndValidity()
    this.businessTypeChoosed = true
    this.setStep(2);
  }

  private loadZipcodes(): void {
    this.commonService.getZipCodes().subscribe((zipcodes: ZipCodesIBDTO[]) => {
      const filteredZipcodes: ZipCodesIBDTO[] = zipcodes.filter((zipcode: ZipCodesIBDTO) => zipcode.deleted_at?.toString() === "0000-00-00 00:00:00")
      this.zipCodeList = filteredZipcodes
      this.options = filteredZipcodes
    })
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

  displayFn(zpCode: any): string {
    return zpCode && zpCode.zipCode ? zpCode.zipCode : '';
  }

  private _filter(name: string): any[] {
    const filterValue = name;
    return this.options.filter((option) => option.zipCode.includes(filterValue))
  }
}
