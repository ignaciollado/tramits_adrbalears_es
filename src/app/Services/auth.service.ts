import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { AuthDTO } from '../Models/auth.dto';
import { JwtHelperService } from '@auth0/angular-jwt';
import { PasswordGeneratorService } from './password-generator-service';
import { BehaviorSubject } from 'rxjs';

export interface AuthToken {
  user_id: string;
  access_token: string;
  days_to_expire_pwd: string;
}

const URL_API = '../../assets/phpAPI/'
const URL_API_SRV = "https://jwt.idi.es/public/index.php"

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'text/plain', /* la única forma de evitar errores de CORS ha sido añadiendo esta cabecera */
  })
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
 
  constructor(
    private http: HttpClient, 
    private jwtHelper: JwtHelperService,
    private passwordService: PasswordGeneratorService) { }

  public login(loginForm: AuthDTO): Observable<AuthToken> {
    return this.http
      .post<AuthToken>( `${URL_API_SRV}/api/login-users/`, loginForm, httpOptions )
  }

  public logout(): void {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('ibrelleu_user');
    window.location.reload()
  }

  public isAuthenticated(): boolean {
    if (this.jwtHelper.isTokenExpired(sessionStorage.getItem("access_token"))) {
      return false
    } else {
      return true
    }
  }

  createUser(userData: any): Observable<any> {
    userData.name = userData.aodl
    userData.password = this.passwordService.generatePassword()
    userData.id_ils = 284
    userData.role = userData.profile
    return this.http.post(`${URL_API_SRV}/create-user-ibrelleu`, userData)
    .pipe(
      
    map((response: any) => {
      return response;
    }),
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

    )
  }

  regeneratePasswordUserApp(userId: number, userData: any): Observable<any> {
  const password = this.passwordService.generatePassword();

  const payload = {
    ...userData,
    name: userData.aodl,
    password
  };

  return this.http.post(`${URL_API_SRV}/generate-user-pwd-ibrelleu/${userId}`, payload);
  }


  private userNameSubject = new BehaviorSubject<string>('');
  userName$ = this.userNameSubject.asObservable();

  private userRoleSubject = new BehaviorSubject<string>('');
  userRole$ = this.userRoleSubject.asObservable();

  private daysToExpirePwdSubject = new BehaviorSubject<number>(0);
  daysToExpirePwd$ = this.daysToExpirePwdSubject.asObservable();

  setUserInfo(name: string, role: string, daysToExpirePwd: number) {
    this.userNameSubject.next(name)
    this.userRoleSubject.next(role)
    this.daysToExpirePwdSubject.next(daysToExpirePwd)
  }

/*   setDaysToExpirePwd(days: number) {
    this.daysToExpirePwdSubject.next(days);
  } */

  loadFromSession() {
    const token = sessionStorage.getItem('access_token');
    if (token) {
      const decoded = new JwtHelperService().decodeToken(token)
      const days = +(sessionStorage.getItem('days_to_expire_pwd') ?? '0');
      this.setUserInfo(decoded.name, decoded.role, days);
      /* this.setDaysToExpirePwd(days); */
    }
  }
}
