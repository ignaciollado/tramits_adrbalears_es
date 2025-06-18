
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
  title: string = 'tramits adrbalears es';
  languageForm: FormGroup = this.fb.group({
  preferredLang: [localStorage.getItem('preferredLang') || 'es']
});


  constructor(private translate: TranslateService, private fb: FormBuilder) {
    this.translate.addLangs (['es', 'ca', 'en']);
    this.translate.setDefaultLang ('es');
    this.translate.use ('es');
  }

  ngOnInit(): void {
    const storedLang = localStorage.getItem('preferredLang') || 'es';
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