import { Routes } from '@angular/router';
import { GrantApplicationFormComponent } from './xecs/grant-application-form/grant-application-form.component';
import { IsbaGrantApplicationFormComponent } from './isba/grant-application-form/grant-application-form.component';
import { HomeComponent } from './home.component';
import { IlsGrantApplicationFormComponent } from './ils/grant-application-form/grant-application-form.component';
import { LoginComponent } from './login/login.component';
import { authGuard } from './auth/auth.guard';
import { XecsManagementComponent } from './xecs/management/xecs-management/xecs-management.component';
import { PasswordRecoveryComponent } from './login/password-recovery/password-recovery.component';
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'recover-password', component: PasswordRecoveryComponent },
  
  { path: 'xecs-grant-subsidies-application-form', component: GrantApplicationFormComponent},
  { path: 'isba-grant-subsidies-application-form', component: IsbaGrantApplicationFormComponent},
  { path: 'ils-grant-subsidies-application-form', component: IlsGrantApplicationFormComponent},

  { path: 'xecs-management', canActivate: [authGuard], component:XecsManagementComponent },
  { path: 'isba-management', canActivate: [authGuard], component:HomeComponent },
  { path: 'ils-management', canActivate: [authGuard], component:HomeComponent },

  { path: 'contact', component: GrantApplicationFormComponent },
  { path: '**', component: HomeComponent }
];
