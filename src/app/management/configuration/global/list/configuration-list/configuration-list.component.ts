import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { PindustConfiguracionService } from '../../../../../Services/pindust-configuracion.service';
import { ConfigurationModelDTO } from '../../../../../Models/configuration.dto';
import { MatTableDataSource } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-configuration-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule, RouterModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule, TranslateModule,
    FormsModule, MatProgressSpinnerModule
  ],
  templateUrl: './configuration-list.component.html',
  styleUrls: ['./configuration-list.component.scss']
})
export class ConfigurationListComponent implements OnInit {

  displayedColumns: string[] = ['id', 'activeGeneralData', 'convocatoria', 'num_BOIB', 'num_BOIB_modific', 'respresidente', 'acciones'];
  dataSource = new MatTableDataSource<ConfigurationModelDTO>();
  filterText = '';
  loading = false;
  error: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private configService: PindustConfiguracionService) {}

  ngOnInit(): void {
     this.loading = true;
    this.obtenerConfiguraciones();
  }

  obtenerConfiguraciones(): void {
    this.configService.getAll().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loading = false;
        // Filtro personalizado (para todas las columnas)
        this.dataSource.filterPredicate = (row, filter: string) => {
          const normalizedFilter = filter.trim().toLowerCase();
          return Object.values(row).some(value =>
            value?.toString().toLowerCase().includes(normalizedFilter)
          );
        };
      },
      error: (err) => {
        this.error = 'Error al cargar las configuraciones.';
        console.error(err);
        this.loading = false;
      }
    });
  }

  aplicarFiltro(): void {
    this.dataSource.filter = this.filterText.trim().toLowerCase();
  }

  eliminarConfiguracion(id: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta configuración?')) {
      this.configService.delete(+id).subscribe({
        next: () => this.obtenerConfiguraciones(),
        error: (err) => {
          this.error = 'Error al eliminar la configuración.';
          console.error(err);
        }
      });
    }
  }
}
