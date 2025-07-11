
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { LanguageService } from './Services/language.service';

import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from './Services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, RouterModule, MatMenuModule, MatIconModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})

export class HeaderComponent implements OnInit {
  title: string = 'tramits adrbalears es-ES';
  languageForm: FormGroup = this.fb.group({
    preferredLang: [localStorage.getItem('preferredLang') || 'es-ES']
  });

  constructor(private translate: TranslateService, 
    private fb: FormBuilder, 
    private authService: AuthService, private router: Router,
    private languageService: LanguageService) {
    this.translate.addLangs (['es-ES', 'ca-ES', 'en-EN']);
    this.translate.setDefaultLang ('es-ES');
    this.translate.use ('es-ES');
  }

  ngOnInit(): void {
    const storedLang = localStorage.getItem('preferredLang') || 'es-ES';
    this.languageForm = this.fb.group({
    preferredLang: [storedLang]
    });
    this.translate.use(storedLang);
  }

  onLanguageChange() {
    const selectedLang = this.languageForm?.get('preferredLang')?.value;
    this.languageService.setLanguage(selectedLang);
    this.translate.use(selectedLang);
  }

  logout(): void {
  this.authService.logout();
  this.router.navigate(['/login']); // redirige después de cerrar sesión
}


}

