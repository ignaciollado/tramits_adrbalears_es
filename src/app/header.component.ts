
import { Component, OnInit } from '@angular/core'
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms'
import { LanguageService } from './Services/language.service'

import { CommonModule } from '@angular/common'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { RouterModule } from '@angular/router'
import { MatMenuModule } from '@angular/material/menu'
import { MatIconModule } from '@angular/material/icon'
import { AuthService } from './Services/auth.service'
import { Router } from '@angular/router'
import { ExpedienteService } from './Services/expediente.service'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, RouterModule, MatMenuModule, MatIconModule, MatSlideToggleModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})

export class HeaderComponent implements OnInit {


  languageForm = this.fb.group({
    preferredLang: ['es-ES'],
    entorno: [false] // valor por defecto
  });

  constructor(private translate: TranslateService, 
    private fb: FormBuilder, 
    private expedienteService: ExpedienteService,
    private authService: AuthService, private router: Router,
    private languageService: LanguageService) {
    this.translate.addLangs (['es-ES', 'ca-ES', 'en-EN']);
    this.translate.setDefaultLang ('es-ES');
    this.translate.use ('es-ES');
  }

  ngOnInit(): void {

    const entornoGuardado = localStorage.getItem('entorno');
    const isPreTramits = entornoGuardado === 'pre-tramits';


    // Establecer el valor inicial del formulario
    this.languageForm.patchValue({ entorno: isPreTramits });


    // Establecer entorno en el servicio
    this.expedienteService.setEntorno(isPreTramits ? 'tramits' : 'pre-tramits');

    
    // Escuchar cambios del toggle
    this.languageForm.get('entorno')?.valueChanges.subscribe((value: boolean | null) => {
      const isPreTramits = value === true; // Asegura que solo true activa pre-tràmits
      const entorno = isPreTramits ? 'pre-tramits' : 'tramits';
      localStorage.setItem('entorno', entorno);
      this.expedienteService.setEntorno(entorno);
    });
    const storedLang = localStorage.getItem('preferredLang') || 'es-ES';
    this.translate.use(storedLang);
  }

  onLanguageChange(): void {
    const selectedLang = this.languageForm.get('preferredLang')?.value ?? 'es-ES';
    this.languageService.setLanguage(selectedLang);
    this.translate.use(selectedLang);
  }


  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']); // redirige después de cerrar sesión
  }
}

