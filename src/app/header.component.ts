
import { Component, OnInit } from '@angular/core'
import { ReactiveFormsModule, FormBuilder } from '@angular/forms'
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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, RouterModule, MatMenuModule, 
    MatIconModule, MatSlideToggleModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})

export class HeaderComponent implements OnInit {
  actualLang!: string;

  languageForm = this.fb.group({
    preferredLang: ['es-ES'],
    entorno: [false] // valor por defecto
  });

  constructor(private translate: TranslateService, 
    private fb: FormBuilder, 
    public authService: AuthService, private router: Router,
    private languageService: LanguageService) {
    this.translate.addLangs (['es-ES', 'ca-ES', 'en-EN']);
    this.translate.setDefaultLang ('es-ES');
    this.translate.use ('es-ES');
  }

  ngOnInit(): void {
  // Leer entorno desde sessionStorage
  const entornoGuardado = sessionStorage.getItem('entorno');
  const isTramits = entornoGuardado === 'tramits';
  this.languageForm.patchValue({ entorno: isTramits });
  /*   this.expedienteService.setEntorno(isTramits ? 'tramits' : 'pre-tramits'); */
  // Leer idioma desde sessionStorage
  const storedLang = sessionStorage.getItem('preferredLang') || 'es-ES';
  this.actualLang = sessionStorage.getItem('preferredLang') || 'es-ES';
  this.languageForm.patchValue({ preferredLang: storedLang });
  this.translate.use(storedLang);

  // Listener de entorno
  this.languageForm.get('entorno')?.valueChanges.subscribe((value: boolean | null) => {
    const entorno = value ? 'tramits' : 'pre-tramits';
    sessionStorage.setItem('entorno', entorno);
  /*     this.expedienteService.setEntorno(entorno); */
    window.location.reload();
  });
  }

  onLanguageChange(): void {
  const selectedLang = this.languageForm.get('preferredLang')?.value ?? 'es-ES';
  this.actualLang = this.languageForm.get('preferredLang')?.value ?? 'es-ES';
  sessionStorage.setItem('preferredLang', selectedLang); // <--- Guarda la selección
  this.languageService.setLanguage(selectedLang);
  this.translate.use(selectedLang);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']); // redirige después de cerrar sesión
  }
}

