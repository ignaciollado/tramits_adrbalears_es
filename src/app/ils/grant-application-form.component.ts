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
import { CustomValidatorsService } from '../Services/custom-validators.service';
import { DataService } from '../Services/data.service';


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
  accordion = viewChild.required(MatAccordion)
  rgpdAccepted = false

  businessType: string = "";
  businessTypeChoosed: boolean = false

  zipCodeList: any[] = []
  filteredOptions: Observable<any[]> | undefined;
  options: any[] = []

  epigrafesIAE: any[] = []

  checkboxID: boolean = true
  checkboxATIB: boolean = true


  constructor(private dataService: DataService, private customValidator: CustomValidatorsService, private fb: FormBuilder) {
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
      // Nombres temporales
      checkboxID: this.fb.control<boolean>(true),
      checkboxATIB: this.fb.control<boolean>(true),
      file_enviardocumentoIdentificacion: this.fb.control<string>(''),
      file_certificadoATIB: this.fb.control<string>('')

    })

    this.dataService.getZipCodes().subscribe((zipcodes: any[]) => {
      const filteredZipcodes = zipcodes.filter((zipcode: any) => zipcode.deleted_at.toString() === "0000-00-00 00:00:00")
      this.zipCodeList = filteredZipcodes
      this.options = filteredZipcodes
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

    // Pendiente de input files.
    this.ilsForm.get('checkboxID')?.valueChanges.subscribe((value: boolean) => {
      this.checkboxID = value
    })

    this.ilsForm.get('checkboxATIB')?.valueChanges.subscribe((value: boolean) => {
      this.checkboxATIB = value
    })
  }

  onSubmit(): void {
    console.log(this.ilsForm.value)
  }

  setStep(index: number) {
    this.step.set(index)
  }

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
