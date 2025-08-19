import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { ActoAdministrativoService } from '../../../Services/acto-administrativo.service';
import { ActoAdministrativoDTO } from '../../../Models/acto-administrativo-dto';

@Component({
  selector: 'app-listado-actos',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatSelectModule,
    RouterModule
  ],
  templateUrl: './listado-actos.component.html',
  styleUrls: ['./listado-actos.component.scss']
})
export class ListadoActosComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['id', 'denominacion', 'tipo_tramite', 'signedBy', 'updated_at', 'acciones'];
  dataSource = new MatTableDataSource<ActoAdministrativoDTO>();
  selectedTipoTramite: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private actoService: ActoAdministrativoService) {}

  ngOnInit(): void {
    this.actoService.getAll().subscribe(data => {
      this.dataSource.data = data;
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(): void {
    this.dataSource.filterPredicate = (data, filter) =>
      filter === '' || data.tipo_tramite === filter;
    this.dataSource.filter = this.selectedTipoTramite;
  }
}
