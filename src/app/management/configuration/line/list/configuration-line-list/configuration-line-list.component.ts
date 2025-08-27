import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PindustLineaAyudaService } from '../../../../../Services/linea-ayuda.service';
import { PindustLineaAyudaDTO } from '../../../../../Models/linea-ayuda-dto';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-linea-ayuda-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './configuration-line-list.component.html',
  styleUrls: ['./configuration-line-list.component.scss']
})

export class LineaAyudaListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['id', 'activeLineData', 'CodigoSIA', 'lineaAyuda', 'convocatoria', 'convocatoria_desde', 'convocatoria_hasta'];
  dataSource = new MatTableDataSource<PindustLineaAyudaDTO>([]);
  loading = false;
  filterValue = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private service: PindustLineaAyudaService) {}

  ngOnInit(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar línea ayuda:', error);
        this.loading = false;
      }
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.filterValue = filterValue;
    this.dataSource.filter = filterValue;
  }

  clearFilter(): void {
    this.filterValue = '';
    this.dataSource.filter = '';
  }
}
