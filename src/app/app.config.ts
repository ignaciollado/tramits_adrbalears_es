import { ApplicationConfig } from '@angular/core';
import { importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { JwtHelperService, JWT_OPTIONS } from '@auth0/angular-jwt';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes),
              provideHttpClient(),
              { provide: JWT_OPTIONS, useValue: {} },
              JwtHelperService
  ]
};


// main.ts o app.config.ts

export function tokenGetter() {
  return localStorage.getItem('access_token');
}

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([]))

  ]
});
