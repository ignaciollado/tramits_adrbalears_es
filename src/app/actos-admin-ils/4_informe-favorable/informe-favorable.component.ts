import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { TranslateModule } from '@ngx-translate/core';
import { ExpedienteService } from '../../Services/expediente.service';
import { SafeResourceUrl } from '@angular/platform-browser';
import { SignatureResponse } from '../../Models/signature.dto';
import { PindustLineaAyudaDTO } from '../../Models/linea-ayuda-dto';

@Component({
  selector: 'app-informe-favorable-ils',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatExpansionModule, MatButtonModule],
  templateUrl: './informe-favorable.component.html',
  styleUrl: './informe-favorable.component.scss'
})
export class InformeFavorableIlsComponent {
  private expediente = inject(ExpedienteService);
  actoAdmin: boolean = false;
  sendedToSign: boolean = false;
  signatureDocState: string = "";
  nifDocGenerado: string = "";
  timeStampDocGenerado: string = "";
  userLoginEmail: string = "";
  ceoEmail: string = "jose.luis@idi.es";
  pdfUrl: SafeResourceUrl | null = null;
  showPdfViewer: boolean = false;
  nameDocGenerado: string = "";
  loading: boolean = false;
  response?: SignatureResponse;
  error?: string;
  lineDetail: PindustLineaAyudaDTO[] = [];
  

}
