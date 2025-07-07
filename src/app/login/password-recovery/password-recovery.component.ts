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
    },
    error: (err) => {
      this.loading = false;

      const status = err?.status;
      const backendMessage = err?.error?.message || '';
      const technicalDetails = typeof err?.error === 'string' ? err.error : JSON.stringify(err.error, null, 2);

      let message = `❌ Error al enviar la solicitud.`;

      if (status === 404) {
        message = '📪 El correo electrónico no está registrado en nuestra base de datos.';
      } else if (backendMessage) {
        message += `❌ ${backendMessage}`;
      }

      // Mostrar mensaje al usuario
      this.snackBar.open(message, 'Cerrar', {
        duration: 8000,
        panelClass: 'snack-error'
      });

      // Detalles técnicos en consola para depurar
      console.error('[Recuperación de contraseña] Error:', {
        status,
        backendMessage,
        detalles: technicalDetails
      });
    },
    complete: () => {
      this.loading = false;
    }
  });
}

}
