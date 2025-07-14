import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { ActoAdministrativoService, ActoAdministrativo } from '../../../Services/acto-administrativo.service';

@Component({
  selector: 'app-listado-actos',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, RouterModule],
  templateUrl: './listado-actos.component.html',
  styleUrls: ['./listado-actos.component.scss']
})
export class ListadoActosComponent implements OnInit {
  displayedColumns: string[] = ['id', 'denominacion', 'tipo_tramite', 'acciones'];
  dataSource: ActoAdministrativo[] = [];

  constructor(private actoService: ActoAdministrativoService) {}

  ngOnInit(): void {
    this.actoService.getAll().subscribe(data => {
      this.dataSource = data;
      console.log ("todos los actos admin", this.dataSource)
    });
  }
}