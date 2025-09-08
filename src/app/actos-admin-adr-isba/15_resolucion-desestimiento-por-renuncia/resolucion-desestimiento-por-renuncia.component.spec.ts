import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolucionDesestimientoPorRenunciaAdrIsbaComponent } from './resolucion-desestimiento-por-renuncia.component';

describe('ResolucionDesestimientoPorRenunciaAdrIsbaComponent', () => {
  let component: ResolucionDesestimientoPorRenunciaAdrIsbaComponent;
  let fixture: ComponentFixture<ResolucionDesestimientoPorRenunciaAdrIsbaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResolucionDesestimientoPorRenunciaAdrIsbaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResolucionDesestimientoPorRenunciaAdrIsbaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
