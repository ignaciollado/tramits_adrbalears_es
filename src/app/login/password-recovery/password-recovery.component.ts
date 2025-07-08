import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../Services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-password-recovery',
  standalone: true,
  imports: [
    CommonModule, TranslateModule,
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

  this.authService.sendRecoverPasswordMail(email).subscribe({
    next: () => {
      this.snackBar.open('📧 Se ha enviado un correo para restablecer la contraseña.', 'Cerrar', {
        duration: 6000,
        panelClass: 'snack-success'
      });
      this.form.reset()
    },
    error: (err) => {
      this.loading = false;

      const status = err?.status || 'desconocido';
      const backendMessage = err?.error?.messages?.error || err?.error?.message || 'Ocurrió un error inesperado.';

      // Mostramos mensaje detallado al usuario
      const userMessage = `❌ Error ${status}: ${backendMessage}`;
      this.snackBar.open(userMessage, 'Cerrar', {
        duration: 8000,
        panelClass: 'snack-error'
      });

      // Registro técnico en consola
      console.error('[Recuperación de contraseña] Error:', {
        status: err?.status,
        errorBody: err?.error
      });
    },
    complete: () => {
      this.loading = false;
    }
  });
}

}
