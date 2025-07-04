import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { importProvidersFrom } from '@angular/core';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { createTranslateLoader } from './app.translate-loader';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { routes } from './app/app.routes';
import { provideRouter } from '@angular/router';
import { JwtModule } from '@auth0/angular-jwt';

export function tokenGetter() {
  return localStorage.getItem('access_token');
}


bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),

    importProvidersFrom(
       JwtModule.forRoot({
        config: {
          tokenGetter,
          allowedDomains: ['tudominio.com'],
          disallowedRoutes: ['tudominio.com/api/auth']
        }
      }),
      HttpClientModule,
      TranslateModule.forRoot({
        defaultLanguage: 'es-ES',
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient]
        }
      })
    )
  ]
});
