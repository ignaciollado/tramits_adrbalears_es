import { Routes } from '@angular/router';
import { GrantApplicationFormComponent } from './xecs/grant-application-form/grant-application-form.component';

export const routes: Routes = [
  { path: 'home', component: GrantApplicationFormComponent },
  { path: 'contact', component: GrantApplicationFormComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', component: GrantApplicationFormComponent }
];
