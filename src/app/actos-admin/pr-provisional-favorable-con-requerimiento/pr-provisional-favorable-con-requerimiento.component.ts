import { Component, inject, Input, OnChanges, SimpleChanges} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-pr-provisional-favorable-con-requerimiento',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatExpansionModule, MatButtonModule],
  templateUrl: './pr-provisional-favorable-con-requerimiento.component.html',
  styleUrl: './pr-provisional-favorable-con-requerimiento.component.scss'
})
export class PrProvisionalFavorableConRequerimientoComponent {


  generateActoAdmin(actoAdministrivoName: string, tipoTramite: string, docFieldToUpdate: string): void {}
}
