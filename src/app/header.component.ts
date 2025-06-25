
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';

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


  constructor(private translate: TranslateService, private fb: FormBuilder) {
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
    localStorage.setItem('preferredLang', selectedLang);
    this.translate.use(selectedLang);
  }
}