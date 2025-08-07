import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { CommonModule } from '@angular/common';

interface DocumentType {
  value: string;
  name: string;
}

@Component({
  selector: 'app-add-document',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatListModule,
    MatExpansionModule
  ],
  templateUrl: './add-document.component.html',
  styleUrl: './add-document.component.scss'
})
export class AddDocumentComponent {
  form!: FormGroup;
  documentTypeControl!: FormControl;
  private fb = inject(FormBuilder);

  documentTypes: DocumentType[] = [
    { value: 'file_memoriaTecnica', name: "Descripció de l'empresa i la seva activitat, model de negoci i detall de la inversió/Inversions previstes" },
    { value: 'file_declaracionResponsable', name: "Declaració responsable de l'empresa" },
    { value: 'file_document_acred_como_repres', name: "Documentació acreditativa de les facultats de representació de la persona que firma la sol·licitud d'ajut" },
    { value: 'file_certificadoATIB', name: "Certificat estar al corrent obligacions amb AEAT i ATIB" },
    { value: 'file_escrituraConstitucion', name: "Còpia escriptures de constitució de l'entitat sol·licitant" },
    { value: 'file_nifRepresentante', name: "DNI/NIE de la persona sol·licitant i/o de la persona que li representi" },
    { value: 'file_certificadoAEAT', name: "Certificat d'estar al corrent de pagament amb la AEAT" },
    { value: 'file_certificadoIAE', name: "Documentació acreditativa alta cens IAE" },
    { value: 'file_certificadoSGR', name: "Certificat de la societat de garantia recíproca" },
    { value: 'file_contratoOperFinanc', name: "El contracte de l'operació financera" },
    { value: 'file_avalOperFinanc', name: "El contracte o document d'aval de l'operació financera" },
    { value: 'file_copiaNIF', name: "La fotocòpia del DNI de la persona que signa la sol.licitud" },
    { value: 'file_certificadoLey382003', name: "Certificat que estableix l'article 13.3 bis de la Llei 38/2003" },
    { value: 'file_document_veracidad_datos_bancarios', name: "Declaració responsable de la veracitat de les dades bancàries segons model CAIB" },
    { value: 'file_altaAutonomos', name: "El certificat d'estar en el règim especial de treballadors autònoms o en un règim alternatiu equivalent" }
  ];

  ngOnInit() {
    this.form = this.fb.group({
      documentType: [null]
    });
    this.documentTypeControl = this.form.get('documentType') as FormControl;
  }


}
