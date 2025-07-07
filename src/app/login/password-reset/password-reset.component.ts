import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, ValidationErrors } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../Services/auth.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.scss']
})
export class PasswordResetComponent {
  resetForm: FormGroup
  token: string | null = null
  email: string | null = null
  errorMessage: string | null = null
  successMessage: string | null = null

  constructor(private fb: FormBuilder, 
    private route: ActivatedRoute, private authService: AuthService) {
    this.resetForm = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: this.passwordsMatch }
    );
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token')
      this.email = params.get('email')
      console.log (this.token, this.email)
    })
  }

  passwordsMatch(form: FormGroup): ValidationErrors | null {
    const pass = form.get('password')?.value;
    const confirm = form.get('confirmPassword')?.value;
    return pass === confirm ? null : { mismatch: true };
  }


onSubmit() {
  if (this.resetForm.valid) {
    const { password } = this.resetForm.value;
    console.log('Nueva contraseña:', password);

    this.authService.resetPassword(this.email, password)
      .pipe(
        catchError(error => {
          console.error('Error al restablecer la contraseña:', error);
          this.errorMessage = '❌ No se pudo restablecer la contraseña. Inténtalo de nuevo.';
          return of(null); // Devuelve un observable vacío para evitar que se rompa el flujo
        }),
        finalize(() => {
          console.log('Petición de restablecimiento finalizada');
          // Aquí podrías cerrar un spinner o limpiar el formulario
        })
      )
      .subscribe(response => {
        if (response) {
          this.successMessage = '✅ Contraseña restablecida correctamente.';
          this.resetForm.reset();
        }
      });
  }
}

}