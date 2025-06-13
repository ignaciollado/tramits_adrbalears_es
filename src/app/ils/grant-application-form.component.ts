import { CommonModule } from '@angular/common';
import { Component, signal, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { CustomValidatorsService } from '../Services/custom-validators.service';
import { DataService } from '../Services/data.service';


@Component({
  selector: 'app-grant-application-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatSelectModule, MatExpansionModule,
    MatAccordion, MatIconModule, MatCheckboxModule, MatRadioModule, TranslateModule],
  templateUrl: './grant-application-form.component.html',
  styleUrl: './grant-application-form.component.scss'
})

export class IlsGrantApplicationFormComponent {
  step = signal(0)
  ilsForm: FormGroup
  accordion = viewChild.required(MatAccordion)

  rgpdAccepted = false

  autorizationFullText: string = ""

  constructor(private dataService: DataService, private customValidator: CustomValidatorsService, private fb: FormBuilder) {
    this.ilsForm = this.fb.group({
      acceptRGPD: this.fb.control<boolean | null>(false, Validators.required)
    })
  }

  ngOnInit(): void {
    this.ilsForm.get('acceptRGPD')?.valueChanges.subscribe((value: boolean) => {
      this.rgpdAccepted = value
      if (value) {
        this.setStep(1)
      }
    })

  }

  setStep(index: number) {
    this.step.set(index)
  }

}
