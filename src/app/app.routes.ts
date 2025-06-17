import { Routes } from '@angular/router';
import { GrantApplicationFormComponent } from './xecs/grant-application-form/grant-application-form.component';
import { IsbaGrantApplicationFormComponent } from './isba/grant-application-form/grant-application-form.component';

import { HomeComponent } from './home.component';
import { Component } from '@angular/core';
import { IlsGrantApplicationFormComponent } from './ils/grant-application-form/grant-application-form.component';

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'xecs-grant-subsidies-application-form', component: GrantApplicationFormComponent},
  { path: 'isba-grant-subsidies-application-form', component: IsbaGrantApplicationFormComponent},
  { path: 'ils-grant-subsidies-application-form', component: IlsGrantApplicationFormComponent},
  { path: 'contact', component: GrantApplicationFormComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', component: HomeComponent }
];
