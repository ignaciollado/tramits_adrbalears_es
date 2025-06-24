import { CommonModule } from '@angular/common';
import { Component, signal, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CommonService } from '../../Services/common.service';
import { CustomValidatorsService } from '../../Services/custom-validators.service';
import { DataService } from '../../Services/data.service';

@Component({
  selector: 'app-grant-application-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatSelectModule, MatExpansionModule,
    MatAccordion, MatCheckboxModule, TranslateModule, MatTooltipModule, MatAutocompleteModule],
  templateUrl: './grant-application-form.component.html',
  styleUrl: './grant-application-form.component.scss'
})
export class IsbaGrantApplicationFormComponent {
  step = signal(0)
  isbaForm: FormGroup
  rgpdAccepted = false

  // 10 MB máximos
  maxFileSizeBytes: number = 10 * 1024 * 1024

  accordion = viewChild.required(MatAccordion)
  constructor(private commonService: CommonService, private dataService: DataService, private customValidator: CustomValidatorsService, private fb: FormBuilder, private snackBar: MatSnackBar) {
    this.isbaForm = this.fb.group({
      acceptRGPD: this.fb.control<boolean | null>(false, [Validators.required]),

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

  }

  onSubmit(): void {

  }

  setStep(index: number): void {
    this.step.set(index)
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
