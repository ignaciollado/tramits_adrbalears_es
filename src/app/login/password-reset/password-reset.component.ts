import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../Services/auth.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule, RouterLink],
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.scss']
})
export class PasswordResetComponent {
  resetForm: FormGroup
  token: string | null = null
  email: string | null = null
  errorMessage: string | null = null
  successMessage: string | null = null
  changedCorrectly: boolean = false

  constructor(private fb: FormBuilder, 
    private route: ActivatedRoute, private authService: AuthService, private snackBar: MatSnackBar) {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,}$/)]], confirmPassword: ['']}, 
      { validators: this.passwordsMatchValidator });
    }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token')
      this.email = params.get('email')
      console.log (this.token, this.email)
    })
  }

  passwordsMatchValidator(group: FormGroup): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.resetForm.valid) {
      const { password } = this.resetForm.value;
      console.log('Nueva contraseña:', password);

      this.authService.resetPassword(this.email, password, this.token)
        .pipe(
          catchError(error => {
            const mensaje = error?.error?.messages?.error || '❌ No se pudo restablecer la contraseña. Inténtalo de nuevo.';
            console.error('Error al restablecer la contraseña:', mensaje);
            this.errorMessage = mensaje;
            this.snackBar.open(this.errorMessage as string, 'Cerrar', {
              duration: 8000,
              panelClass: 'snack-error'
            });
            return of(null); // Evita que se rompa el flujo
          }),
          finalize(() => {
            console.log('Petición de restablecimiento finalizada');
          })
        )
        .subscribe(response => {
          if (response) {
            this.successMessage = '✅ Contraseña restablecida correctamente.';
            this.snackBar.open(this.successMessage, 'Cerrar', {
              duration: 8000,
              panelClass: 'snack-success'
            });
            this.changedCorrectly = true
            this.resetForm.reset();
          }
        });
    }
  }
}