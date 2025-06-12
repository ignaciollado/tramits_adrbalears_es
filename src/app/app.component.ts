import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  //imports: [RouterLink, RouterOutlet],
  imports: [RouterModule,  HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'tramits adrbalears es';
}
