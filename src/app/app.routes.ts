import { Routes } from '@angular/router';
import { GrantApplicationFormComponent } from './xecs/grant-application-form/grant-application-form.component';
import { IsbaGrantApplicationFormComponent } from './isba/grant-application-form/grant-application-form.component';
import { HomeComponent } from './home.component';
import { IlsGrantApplicationFormComponent } from './ils/grant-application-form/grant-application-form.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './auth/auth.guard';
import { XecsManagementComponent } from './xecs/management/xecs-management/xecs-management.component';
import { PasswordRecoveryComponent } from './login/password-recovery/password-recovery.component';
import { PasswordResetComponent } from './login/password-reset/password-reset.component';
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'recover-password', component: PasswordRecoveryComponent },
  { path: 'reset-password', component: PasswordResetComponent},
  
  { path: 'xecs-grant-subsidies-application-form', component: GrantApplicationFormComponent},
  { path: 'isba-grant-subsidies-application-form', component: IsbaGrantApplicationFormComponent},
  { path: 'ils-grant-subsidies-application-form', component: IlsGrantApplicationFormComponent},

  { path: 'xecs-management', canActivate: [AuthGuard], component:XecsManagementComponent },
  { path: 'isba-management', canActivate: [AuthGuard], component:HomeComponent },
  { path: 'ils-management', canActivate: [AuthGuard], component:HomeComponent },

  { path: 'contact', component: GrantApplicationFormComponent },
  { path: '**', component: HomeComponent }
];
