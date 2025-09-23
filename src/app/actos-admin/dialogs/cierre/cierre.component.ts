import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { ExpedienteService } from '../../../Services/expediente.service';
import { CommonService } from '../../../Services/common.service';

@Component({
  selector: 'app-dialog-cierre',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, TranslateModule,
    MatDialogModule, MatButtonModule
  ],
  templateUrl: './cierre.component.html',
  styleUrl: './cierre.component.scss'
})
export class DialogCierreComponent {
  private expedienteService = inject(ExpedienteService);
  private fb = inject(FormBuilder)
  public cierreForm!: FormGroup;
  constructor(
    public dialogRef: MatDialogRef<DialogCierreComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { idExpediente: number },
    private commonService: CommonService
  ) { }

  ngOnInit(): void {
    this.cierreForm = this.fb.group({
      actaNumCierre: [{ value: '', disabled: false }, [Validators.required]],
      fecha_reunion_cierre: [{ value: '', disabled: false }, [Validators.required]],
      fecha_limite_justificacion: [{ value: '', disabled: false }, [Validators.required]],
      horaInicioActaCierre: [{ value: '', disabled: false }, [Validators.required]],
      horaFinActaCierre: [{ value: '', disabled: false }, [Validators.required]],
      lugarActaCierre: [{ value: '', disabled: false }, [Validators.required]],
      asistentesActaCierre: [{ value: '', disabled: false }, [Validators.required]],
      observacionesActaCierre: [{ value: '', disabled: false }, [Validators.required]],
    })

    if (this.cierreForm && this.data.idExpediente) {
      this.expedienteService.getOneExpediente(this.data.idExpediente).subscribe((expediente: any) => {
        expediente.fecha_reunion_cierre = expediente.fecha_reunion_cierre.split(" ")[0];
        this.cierreForm.patchValue(expediente);
      })
    }
  }

  save(): void {
    const formValues = this.cierreForm.getRawValue();
    this.expedienteService.updateExpediente(this.data.idExpediente, formValues).subscribe({
      next: () => {
        this.commonService.showSnackBar('Actualizado expediente con datos de Acta de Cierre');
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
