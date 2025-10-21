import { ChangeDetectorRef, Component, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './header.component';
import { FooterComponent } from './footer/footer.component';
import { AuthService } from './Services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, HeaderComponent, FooterComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  showHeader = true;
  constructor(public authService: AuthService, private cdr: ChangeDetectorRef) { }
  logout(): void {
    this.authService.logout();
  }

  manageHeaderInRoute(component: any) {
    if (component.noHeader instanceof EventEmitter) {
      component.noHeader.subscribe((value: boolean) => {
        this.showHeader = !value
      });
    } else {
      this.showHeader = true;
    }
    this.cdr.detectChanges();
  }
}
