import { Component, inject, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ExpedienteService } from '../../../Services/expediente.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { CommonService } from '../../../Services/common.service';

@Component({
  selector: 'app-dialog-kick-off',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    TranslateModule, MatDialogModule, MatButtonModule
  ],
  templateUrl: './kick-off.component.html',
  styleUrl: './kick-off.component.scss'
})
export class DialogKickOffComponent {
  private expedienteService = inject(ExpedienteService);
  private fb = inject(FormBuilder);
  public kickOffForm!: FormGroup;
  constructor(
    public dialogRef: MatDialogRef<DialogKickOffComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { idExpediente: number },
    private commonService: CommonService
  ) { }

  ngOnInit(): void {
    this.kickOffForm = this.fb.group({
      actaNumKickOff: [{ value: '', disabled: false }, [Validators.required]],
      fecha_kick_off: [{ value: '', disabled: false }, [Validators.required]],
      fecha_HastaRealizacionPlan: [{ value: '', disabled: false }, [Validators.required]],
      horaInicioSesionKickOff: [{ value: '', disabled: false }, [Validators.required]],
      horaFinSesionKickOff: [{ value: '', disabled: false }, [Validators.required]],
      lugarSesionKickOff: [{ value: '', disabled: false }, [Validators.required]],
      asistentesKickOff: [{ value: '', disabled: false }, [Validators.required]],
      tutorKickOff: [{ value: '', disabled: false }, [Validators.required]],
      plazosRealizacionPlan: [{ value: '', disabled: false }, [Validators.required]],
      observacionesKickOff: [{ value: '', disabled: false }, [Validators.required]]
    })

    if (this.kickOffForm && this.data.idExpediente) {
      this.expedienteService.getOneExpediente(this.data.idExpediente).subscribe((expediente: any) => {
        this.kickOffForm.patchValue(expediente);
      })
    }
  }

  save(): void {
    const formValues = this.kickOffForm.getRawValue();
    this.expedienteService.updateExpediente(this.data.idExpediente, formValues).subscribe({
      next: () => {
        this.commonService.showSnackBar('Actualizado expediente con datos de Acta de Kick Off');
        this.dialogRef.close({
          guardado: true,
          datosFormulario: formValues
        }
        );
      },
      error: (err) => {
        console.error('Ha ocurrido un error: ', err);
        this.dialogRef.close(false);
      }
    })
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
