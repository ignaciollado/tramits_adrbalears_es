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
    let responseOK: boolean = false
    let errorResponse: any
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('ibrelleu_user');

    if ( this.loginForm ) {
        this.authService.login( this.loginForm.value )
        .subscribe (
          (item:AuthToken ) => {
            console.log ("Welcome to IBRelleu Market Place created by the ADR Balears ...")
            responseOK = true
            errorResponse = "Logged in"
            sessionStorage.setItem('ibrelleu_user', this.jwtHelper.decodeToken(item.access_token).name)
            sessionStorage.setItem('access_token', item.access_token)
            sessionStorage.setItem("preferredLang", "cat")
            sessionStorage.setItem("days_to_expire_pwd", item.days_to_expire_pwd)
            this.authService.setUserInfo(this.jwtHelper.decodeToken(item.access_token).name, this.jwtHelper.decodeToken(item.access_token).role, +item.days_to_expire_pwd);

            this.showSnackBar(errorResponse + " as " + this.jwtHelper.decodeToken(item.access_token).name)
            if (this.jwtHelper.decodeToken().role === 'admin') {
              this.isSuperUser = true
            }
            this.router.navigate(['/body'])
            },
            (error: any) => {
                  responseOK = false
                  this.showSnackBar(error)
                  this.loginForm.reset()
                },
                  () => {
                    console.log("Login complete, redirecting ...")
                    this.router.navigateByUrl('home')
                  }
        )
    }
  }

  private showSnackBar(error: string): void {
    this.snackBar.open( error, 'X', { duration: 10000, verticalPosition: 'top', 
      horizontalPosition: 'center', panelClass: ["custom-snackbar"]} );
  }
}