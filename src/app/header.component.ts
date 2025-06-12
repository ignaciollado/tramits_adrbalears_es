import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, TranslateModule, RouterModule, MatMenuModule, MatIconModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  title = 'tramits adrbalears es';
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