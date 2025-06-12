import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  constructor(private translate: TranslateService) {
    this.translate.addLangs(['es', 'ca', 'en']);
    this.translate.setDefaultLang('es');
    this.translate.use('es');
  }

onLanguageChange(event: Event) {
  const selectElement = event.target as HTMLSelectElement;
  const lang = selectElement.value;
  this.translate.use(lang)
}

}