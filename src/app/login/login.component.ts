import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService, AuthToken } from '../Services/auth.service';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, TranslateModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  isSuperUser: boolean = false

  constructor(private fb: FormBuilder, private translate: TranslateService,
        private authService: AuthService,
        private router: Router,  
        private snackBar: MatSnackBar,
        private jwtHelper: JwtHelperService 
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      console.log('Login con:', email, password);
    }

    
    let errorResponse: any
    sessionStorage.removeItem('access_token');
    if ( this.loginForm ) {
        this.authService.login( this.loginForm.value )
        .subscribe (
          (item:AuthToken ) => {
            console.log ("Welcome to IBRelleu Market Place created by the ADR Balears ...")
            errorResponse = "Logged in"
            const decodedToken = this.jwtHelper.decodeToken(item.access_token);
            sessionStorage.setItem('ibrelleu_user', decodedToken.name)
            sessionStorage.setItem('access_token', item.access_token)
            sessionStorage.setItem("preferredLang", "cat")
            sessionStorage.setItem("days_to_expire_pwd", item.days_to_expire_pwd)
            console.log (decodedToken)
            this.authService.setUserInfo(decodedToken.name, decodedToken.role, +item.days_to_expire_pwd);

            this.showSnackBar(errorResponse + " as " + this.jwtHelper.decodeToken(item.access_token).name)
           
            if (decodedToken.role === 'admin') {
              this.isSuperUser = true;
            }

            this.router.navigate(['/body'])
            },
(error: any) => {
  let message = '❌ Ha ocurrido un error inesperado.';
  
  if (error.status === 0) {
    message = '❌ No se pudo conectar con el servidor. Verifica tu conexión.';
  } else if (error.status === 401) {
    message = '🔒 Credenciales incorrectas. Revisa tu correo electrónico o contraseña.';
  } else if (error.status === 403) {
    message = '⛔ Acceso denegado. No tienes permisos suficientes.';
  } else if (error.status === 500) {
    message = '💥 Error interno del servidor. Intenta de nuevo más tarde.';
  } else if (error.error?.message) {
    message = `⚠️ ${error.error.message}`;
  }

  console.error('Error durante el login:', error);
  this.showSnackBar(message);
  this.loginForm.reset();
}
,
            () => {
                  console.log("Login complete, redirecting ...")
                  this.router.navigateByUrl('home')
            }
        )
    }
  }

private showSnackBar(message: string, panelClass = 'custom-snackbar'): void {
  this.snackBar.open(message, 'X', {
    duration: 10000,
    verticalPosition: 'top',
    horizontalPosition: 'center',
    panelClass: [panelClass]
  });
}

}