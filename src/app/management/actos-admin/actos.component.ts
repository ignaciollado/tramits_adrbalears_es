import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { HttpClientModule } from '@angular/common/http';
import { ActoAdministrativoService, ActoAdministrativo } from '../../Services/acto-administrativo.service';
import { MatDividerModule } from '@angular/material/divider';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
  
  @Component({
  selector:  'app-actos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatDividerModule,
    HttpClientModule
  ],
  templateUrl: './actos.component.html',
  styleUrls: ['./actos.component.scss']
})
export class ActosComponent implements OnInit {
  actoForm: FormGroup;
  editingId: number | null = null;
  actos: ActoAdministrativo[] = [];
  deletedActos: ActoAdministrativo[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private actoService: ActoAdministrativoService,
    private route: ActivatedRoute
  ) {
    this.actoForm = this.fb.group({
      denominacion: [{value:'', disabled: true}, [Validators.required, Validators.maxLength(100)]],
      tipo_tramite: [{value:'', disabled: true},, [Validators.required, Validators.maxLength(20)]],
      texto: ['', Validators.required],
      texto_es: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.editingId = id;
      this.actoService.getById(id).subscribe(acto => {
        if (acto) {
          console.log ("acto", acto)
          this.actoForm.patchValue(acto);
        }
      });
    }

    this.loadActos();
    this.loadDeletedActos();
  }

  loadActos(): void {
    this.actoService.getAll().subscribe(data => this.actos = data);
  }

  loadDeletedActos(): void {
    this.actoService.getDeleted().subscribe(data => this.deletedActos = data);
  }

  onSubmit(): void {
    if (this.actoForm.invalid) return;
    const data = this.actoForm.value;

    if (this.editingId) {
      this.actoService.update(this.editingId, data).subscribe(() => {
        this.loadActos();
        this.cancelEdit();
      });
    } else {
      this.actoService.create(data).subscribe(() => {
        this.loadActos();
        this.actoForm.reset();
      });
    }
  }

  edit(acto: ActoAdministrativo): void {
    this.editingId = acto.id!;
    this.actoForm.patchValue(acto);
  }

  cancelEdit(): void {
    this.editingId = null;
    this.actoForm.reset();
    this.router.navigate(['/actos-admin-list']); 
  }

  delete(id: number): void {
    this.actoService.delete(id).subscribe(() => {
      this.loadActos();
      this.loadDeletedActos();
    });
  }

  restore(id: number): void {
    this.actoService.restore(id).subscribe(() => {
      this.loadActos();
      this.loadDeletedActos();
    });
  }

  resaltarTexto(texto: string): string {
  if (!texto) return '';
  return texto.replace(/%([^%]+)%/g, '<span style="background-color: yellow; font-weight: bold;">%$1%</span>');
}

}
