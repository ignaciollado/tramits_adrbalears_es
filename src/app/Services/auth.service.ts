// auth.service.ts

import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError, BehaviorSubject } from 'rxjs';
import { AuthDTO } from '../Models/auth.dto';
import { JwtHelperService } from '@auth0/angular-jwt';
import { PasswordGeneratorService } from './password-generator-service';

export interface AuthToken {
  user_id: string;
  access_token: string;
  days_to_expire_pwd: string;
}

const URL_API_SRV = 'https://jwt.idi.es/public/index.php';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'text/plain',
  }),
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private authStatusSubject = new BehaviorSubject<boolean>(false);
  authStatus$ = this.authStatusSubject.asObservable();

  private userNameSubject = new BehaviorSubject<string>('');
  userName$ = this.userNameSubject.asObservable();

  private userRoleSubject = new BehaviorSubject<string>('');
  userRole$ = this.userRoleSubject.asObservable();

  private daysToExpirePwdSubject = new BehaviorSubject<number>(0);
  daysToExpirePwd$ = this.daysToExpirePwdSubject.asObservable();

  constructor(
    private http: HttpClient,
    private jwtHelper: JwtHelperService,
    private passwordService: PasswordGeneratorService
  ) {
    this.updateAuthStatus();
  }

  private updateAuthStatus(): void {
    const token = sessionStorage.getItem('access_token');
    const isAuth = token != null && !this.jwtHelper.isTokenExpired(token);
    this.authStatusSubject.next(isAuth);
  }

  public login(loginForm: AuthDTO): Observable<AuthToken> {
    return this.http
      .post<AuthToken>(`${URL_API_SRV}/api/login-users/`, loginForm, httpOptions)
      .pipe(
        map((token: AuthToken) => {
          sessionStorage.setItem('access_token', token.access_token);
          sessionStorage.setItem('ibrelleu_user', token.user_id);
          sessionStorage.setItem('days_to_expire_pwd', token.days_to_expire_pwd);

          const decoded = this.jwtHelper.decodeToken(token.access_token);
          this.setUserInfo(decoded.name, decoded.role, +token.days_to_expire_pwd);
          this.authStatusSubject.next(true);

          return token;
        })
      );
  }

  public logout(): void {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('ibrelleu_user');
    sessionStorage.removeItem('days_to_expire_pwd');
    this.authStatusSubject.next(false);
    window.location.reload();
  }

  public isAuthenticated(): boolean {
    const token = sessionStorage.getItem('access_token');
    const isValid = token != null && !this.jwtHelper.isTokenExpired(token);
    this.authStatusSubject.next(isValid);
    return isValid;
  }

  public recoverPassword(email: string): Observable<any> {
    return this.http.post('/api/auth/recover-password', { email });
  }

  public resetPassword(userMail: string, password: string): Observable<any> {
    return this.http.post(`${URL_API_SRV}/reset-user-pwd/${userMail}`, {password})
  }

  public createUser(userData: any): Observable<any> {
    userData.name = userData.aodl;
    userData.password = this.passwordService.generatePassword();
    userData.id_ils = 284;
    userData.role = userData.profile;

    return this.http.post(`${URL_API_SRV}/create-user-ibrelleu`, userData).pipe(
      map((response: any) => response),
      catchError((error: HttpErrorResponse) => {
        let errorMsg = 'Error desconocido al crear el usuario.';
        if (error.error?.message) {
          errorMsg = error.error.message;
        } else if (error.status === 0) {
          errorMsg = 'No se pudo conectar con el servidor.';
        } else if (error.status === 400) {
          errorMsg = 'Datos inválidos enviados al servidor.';
        } else if (error.status === 409) {
          errorMsg = 'El usuario ya existe.';
        }
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  public regeneratePasswordUserApp(userId: number, userData: any): Observable<any> {
    const password = this.passwordService.generatePassword();
    const payload = {
      ...userData,
      name: userData.aodl,
      password,
    };
    return this.http.post(`${URL_API_SRV}/generate-user-pwd-ibrelleu/${userId}`, payload);
  }

  public setUserInfo(name: string, role: string, daysToExpirePwd: number): void {
    this.userNameSubject.next(name);
    this.userRoleSubject.next(role);
    this.daysToExpirePwdSubject.next(daysToExpirePwd);
  }
}
