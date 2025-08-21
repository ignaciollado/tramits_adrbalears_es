import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MejoraSolicitudDTO } from '../../Models/mejoras-solicitud-dto';
import { MejorasSolicitudService } from '../../Services/mejoras-solicitud.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../../confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-mejoras-solicitud-detalle-adr-isba',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatFormFieldModule,
    MatInputModule, MatButtonModule],
  templateUrl: './mejoras-solicitud-detalle.component.html',
  styleUrl: './mejoras-solicitud-detalle.component.scss'
})
export class MejorasSolicitudDetalleAdrIsbaComponent implements OnChanges {
  @Input() id_sol!: number;

  dataSource = new MatTableDataSource<any>();
  displayedColumns: string[] = ['fecha_rec_mejora', 'ref_rec_mejora', 'action'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterviewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  form!: FormGroup;
  loading: boolean = false;
  error: string = "";
  mejoraOriginal: MejoraSolicitudDTO | null = null;

  constructor(
    private fb: FormBuilder,
    private mejorasSolicitudService: MejorasSolicitudService,
    private dialog: MatDialog, private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      fecha_rec_mejora: ['', Validators.required],
      ref_rec_mejora: ['', Validators.required]
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['id_sol'] && this.id_sol) {
      this.loadMejorasSolicitud();
    }
  }

  loadMejorasSolicitud(): void {
    this.loading = true;
    this.error = '';
    this.mejorasSolicitudService.getMejorasSolicitud(this.id_sol)
      .subscribe({
        next: data => {
          this.dataSource.data = data;
          this.loading = false;
        }, error: err => {
          this.error = '<strong>No se han encontrado mejoras para esta solicitud</strong>';
          this.loading = false;
        }
      });
  }

  save(): void {
    if (!this.form.valid) return;

    const formValue = { ...this.form.value };

    if (formValue.ref_rec_mejora) {
      formValue.ref_rec_mejora = formValue.ref_rec_mejora.toUpperCase();
    }

    const newData: MejoraSolicitudDTO = {
      ...formValue,
      id_sol: this.id_sol
    }

    this.mejorasSolicitudService.createMejoraSolicitud(newData).subscribe({
      next: (response) => {
        alert(response.message || 'Mejora registrada correctamente');
        this.loadMejorasSolicitud();
        this.form.reset();
      },
      error: () => alert('Error al registrar la mejora')
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

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result === true) {
        // la llamada al servicio para eliminar
        this.mejorasSolicitudService.deleteMejoraSolicitud(item.id_sol)
        this.snackBar.open('Mejora eliminada', 'Cerrar', { duration: 3000 });
        // Opcional: eliminar del dataSource localmente
        this.dataSource.data = this.dataSource.data.filter(i => i !== item);
      }
    })
  }

}
