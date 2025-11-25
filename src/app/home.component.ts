import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ExpedienteService } from './Services/expediente.service';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatTableDataSource } from '@angular/material/table';
import { DashboardComponent } from "./management/dashboard/dashboard.component";
import { AuthService } from './Services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, MatCardModule, MatTableModule, DashboardComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  preferredLang: string | null = localStorage.getItem("preferredLang")
  estadisticas: any[] = []
  isAuthenticated: boolean = false
  currentUserDetails!: string
  loading: boolean = true
  error: string | null = null

  programas: string[] = [
    'Programa I',
    'Programa II',
    'Programa III actuacions corporatives',
    'Programa III actuacions producte',
    'Programa IV'
  ];

  displayedColumns: string[] = ['situacion', 'total', 'total_importe'];

  constructor(private expedienteService: ExpedienteService, private authService: AuthService) {}

  ngOnInit(): void {
  if (this.authService.isAuthenticated()) {
      this.currentUserDetails = "Actual user: " + sessionStorage.getItem("tramits_user_email") + " (<strong>" + sessionStorage.getItem("days_to_expire_pwd") + "</strong> days until your password expires)"
      this.isAuthenticated = true
    }
    const currentYear = new Date().getFullYear();
    const years: number[] = Array.from({ length: 1 }, (_, i) => currentYear - i); // convocatoria actual, asignar a length el número de convocatorias que se desean visualizar
    const observables = [];

    for (const year of years) {
      for (const programa of this.programas) {
        observables.push(
          this.expedienteService.estadisticaExpediente(year, undefined, programa)
        );
      }
    }

    forkJoin(observables).subscribe({
      next: (results: any[]) => {
        const flatResults = results.flatMap(r => r.data?.length ? [{ filters: r.filters, data: r.data }] : []);

        // Agrupar por convocatoria
        const groupedByConvocatoria: any = {};
        flatResults.forEach(item => {
          const convocatoria = item.filters.convocatoria;
          if (!groupedByConvocatoria[convocatoria]) {
            groupedByConvocatoria[convocatoria] = [];
          }
          groupedByConvocatoria[convocatoria].push({
            tipo_tramite: item.filters.tipo_tramite,
            dataSource: new MatTableDataSource(item.data)
          });
        });

        this.estadisticas = Object.keys(groupedByConvocatoria).map(conv => ({
          convocatoria: conv,
          programas: groupedByConvocatoria[conv]
        }));

        this.loading = false;
      },
      error: (err) => {
        console.error('Error al obtener estadísticas:', err);
        this.error = 'No se pudieron cargar las estadísticas';
        this.loading = false;
      }
    });
  }

  getTotal(data: any[], field: string): number {
    return data.reduce((acc, item) => acc + Number(item[field] || 0), 0);
  }
}
