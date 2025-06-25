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
import { ZipCodesIBDTO } from '../../Models/zip-codes-ib.dto';
import { CommonService } from '../../Services/common.service';
import { CustomValidatorsService } from '../../Services/custom-validators.service';
import { CnaeDTO } from '../../Models/cnae.dto';

@Component({
  selector: 'app-grant-application-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatSelectModule, MatExpansionModule,
    MatAccordion, MatCheckboxModule, TranslateModule, MatTooltipModule, MatAutocompleteModule,
    MatRadioModule],
  templateUrl: './grant-application-form.component.html',
  styleUrl: './grant-application-form.component.scss'
})
export class IsbaGrantApplicationFormComponent {
  step = signal(0)
  isbaForm: FormGroup
  rgpdAccepted = false
  businessType: string = "";
  businessTypeChoosed: boolean = false // Evitar problemas de validadores

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
      denom_interesado: this.fb.control<string>('', [Validators.required]),
      domicilio: this.fb.control<string>('', [Validators.required]),
      cpostal: this.fb.control<string>('', [Validators.required, Validators.minLength(5), Validators.maxLength(5)]),
      localidad: this.fb.control<string>(''),
      telefono_cont: this.fb.control<string>('', [Validators.required, Validators.pattern('[0-9]{9}'), Validators.minLength(9), Validators.maxLength(9)]),
      codigoIAE: this.fb.control<string>('', [Validators.required]),

      // Seteo sus validadores y sus enables/disables en base a business_type
      nom_representante: this.fb.control<string>({ value: '', disabled: true }, []),
      nif_representante: this.fb.control<string>({ value: '', disabled: true }, []),
      telefono_contacto_rep: this.fb.control<string>({ value: '', disabled: true }, []),

      tel_representante: this.fb.control<string>('', [Validators.required, Validators.maxLength(9), Validators.minLength(9), Validators.pattern('[0-9]{9}')]),
      mail_representante: this.fb.control<string>('', [Validators.required, Validators.email]),
      nom_entidad: this.fb.control<string>('', [Validators.required]),
      importe_prestamo: this.fb.control<string>('', [Validators.required, Validators.pattern('^\\d+(\\.\\d+)?$')]),
      plazo_prestamo: this.fb.control<string>('', [Validators.required,]),
      fecha_aval_isba: this.fb.control<string>('', [Validators.required]),
      plazo_aval_isba: this.fb.control<string>('', [Validators.required]),
      cuantia_aval_isba: this.fb.control<string>('', [Validators.required, Validators.pattern('^\\d+(\\.\\d+)?$')]),




      tipo_tramite: this.fb.control<string>('ADR-ISBA')

    })
  }

  ngOnInit(): void {
    // Desbloqueo por RGPD
    this.isbaForm.get('acceptRGPD')?.valueChanges.subscribe((value: boolean) => {
      this.rgpdAccepted = value
      if (value) {
        this.setStep(1)
      }
    })

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


  /* Método que permite hacer lo siguiente tras seleccionar el tipo de empresa:
    - Cambia businessType a autonomo u otros
    - Setea los validadores correspondientes. En el caso del nif, aplicará de forma dinámica el validador de DNI/NIE o de CIF
    - Habilita/desactiva los campos de los representantes según si es autónomo u otros.
    - En caso de desactivar los campos de representante legal, se limpiará con reset('') 
  */
  onBusinessTypeChange(): void {
    const tipo_solicitante = this.isbaForm.get('tipo_solicitante')?.value
    
    const applicantNif = this.isbaForm.get('nif')

    const repName = this.isbaForm.get('nom_representante')
    const repNif = this.isbaForm.get('nif_representante')
    const repPhone = this.isbaForm.get('telefono_contacto_rep')

    const applicantNifValidators = [Validators.required, Validators.minLength(9), Validators.maxLength(9)]
    const repNameValidators = []
    const repNifValidators = [this.customValidator.dniNieValidator(), Validators.minLength(9), Validators.maxLength(9)]
    const repPhoneValidators = [Validators.minLength(9), Validators.maxLength(9), Validators.pattern('[0-9]{9}')]

    if (tipo_solicitante === "autonomo") {
      this.businessType = "autonomo"
      applicantNifValidators.push(this.customValidator.dniNieValidator());

      [repName, repNif, repPhone].forEach(control => {
        control?.disable()
        control?.reset('')
      })
    } else {
      this.businessType = "otros"
      applicantNifValidators.push(this.customValidator.cifValidator())

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
    repPhone?.setValidators(repPhoneValidators);

    [applicantNif, repName, repNif, repPhone].forEach(control => control?.updateValueAndValidity())

    this.businessTypeChoosed = true
    this.setStep(2)
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

  // Limpieza espacios en blanco
  cleanBlank(event: any) {
    const inputElement = (event.target as HTMLInputElement)
    inputElement.value = inputElement.value.replace(/\s+/g, '')
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
