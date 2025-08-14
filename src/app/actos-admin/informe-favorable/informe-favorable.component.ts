import { Component, inject, Input, OnChanges, SimpleChanges} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-informe-favorable',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatExpansionModule, MatButtonModule],
  templateUrl: './informe-favorable.component.html',
  styleUrl: './informe-favorable.component.scss'
})
export class InformeFavorableComponent {



  generateActoAdmin(actoAdministrivoName: string, tipoTramite: string, docFieldToUpdate: string): void {}

}
