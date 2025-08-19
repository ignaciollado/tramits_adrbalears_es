import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MejorasSolicitudService } from '../../Services/mejoras-solicitud.service';
import { MejoraSolicitudDTO } from '../../Models/mejoras-solicitud-dto';
import { MatTableModule } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../../confirm-dialog.component';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-mejoras-solicitud-detalle',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatFormFieldModule,
    MatInputModule, MatButtonModule],
  templateUrl: './mejoras-solicitud-detalle.component.html',
  styleUrls: ['./mejoras-solicitud-detalle.component.scss']
})
export class MejorasSolicitudDetalleComponent implements OnChanges {
  @Input() id_sol!: number;

  dataSource = new MatTableDataSource<any>();
  displayedColumns: string[] = ['fecha_rec_mejora', 'ref_rec_mejora', 'action'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  form!: FormGroup;
  loading = false;
  error = '';
  mejoraOriginal: MejoraSolicitudDTO | null = null;

  constructor(
    private fb: FormBuilder,
    private mejorasSolicitudService: MejorasSolicitudService,
    private dialog: MatDialog, private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      fecha_rec_mejora: ['', Validators.required],
      ref_rec_mejora: ['', [Validators.required]]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['id_sol'] && this.id_sol) {
      this.loadMejorasSolicitud();
    }
  }

loadMejorasSolicitud(): void {
  this.loading = true;
  this.error = '';
  this.mejorasSolicitudService.getMejorasSolicitud(this.id_sol).subscribe({
    next: data => {
      this.dataSource.data = data; // ✅ asignación directa
      this.loading = false;
    },
    error: err => {
      this.error = 'Error al cargar las mejoras de la solicitud';
      this.loading = false;
    }
  });
}


save(): void {
  if (!this.form.valid) return;

  const newData: MejoraSolicitudDTO = {
    ...this.form.value
  };

  this.mejorasSolicitudService.createMejoraSolicitud(newData).subscribe({
    next: () => alert('Mejora creada correctamente'),
    error: () => alert('Error al crear la mejora')
  });
}


 delete(item: any): void {
  const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    width: '300px',
    data: {
      title: '¿Eliminar mejora?',
      message: `¿Estás seguro de que deseas eliminar la mejora con referencia "${item.ref_rec_mejora}"?`
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result === true) {
      // la llamada al servicio para eliminar
      this.mejorasSolicitudService.deleteMejoraSolicitud(item.id_sol)
      this.snackBar.open('Mejora eliminada', 'Cerrar', { duration: 3000 });
      // Opcional: eliminar del dataSource localmente
      this.dataSource.data = this.dataSource.data.filter(i => i !== item);
    }
  });
}
}
