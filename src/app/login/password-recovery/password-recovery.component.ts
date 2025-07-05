import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-password-recovery',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './password-recovery.component.html',
  styleUrls: ['./password-recovery.component.scss']
})
export class PasswordRecoveryComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const email = this.form.value.email;
    this.loading = true;

    this.authService.recoverPassword(email).subscribe({
      next: () => {
        this.snackBar.open('📧 Se ha enviado un correo para restablecer la contraseña.', 'Cerrar', {
          duration: 6000,
          panelClass: 'snack-success'
        });
      },
      error: (err) => {
        let message = '❌ Error al enviar la solicitud.';
        if (err.status === 404) {
          message = 'El correo electrónico no está registrado.';
        } else if (err.error?.message) {
          message = err.error.message;
        }
        this.snackBar.open(message, 'Cerrar', {
          duration: 6000,
          panelClass: 'snack-error'
        });
      },
      complete: () => this.loading = false
    });
  }
}
