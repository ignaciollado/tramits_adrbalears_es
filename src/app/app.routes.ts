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
import { ActosComponent } from './management/actos-admin/actos.component';
import { ListadoActosComponent } from './management/actos-admin/list/listado-actos.component';
import { IsbaManagementComponent } from './isba/management/isba-management/isba-management.component';
import { IlsManagementComponent } from './ils/management/ils-management/ils-management.component';
import { DetailExpedComponent } from './xecs/management/detail/detail-exped/detail-exped.component';

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
  { path: 'isba-management', canActivate: [AuthGuard], component:IsbaManagementComponent },
  { path: 'ils-management', canActivate: [AuthGuard], component:IlsManagementComponent },

  { path: 'detail-exped/:id', canActivate: [AuthGuard], component: DetailExpedComponent},

  { path: 'actos-admin-list', canActivate: [AuthGuard], component: ListadoActosComponent},
  { path: 'acto-admin-detail/:id', canActivate: [AuthGuard], component: ActosComponent},

  { path: 'contact', component: GrantApplicationFormComponent },
  { path: '**', component: HomeComponent }
];
