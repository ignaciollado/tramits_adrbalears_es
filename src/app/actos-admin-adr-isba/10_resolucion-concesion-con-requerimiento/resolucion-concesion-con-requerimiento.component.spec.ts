import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolucionConcesionConRequerimientoAdrIsbaComponent } from './resolucion-concesion-con-requerimiento.component';

describe('ResolucionConcesionConRequerimientoAdrIsbaComponent', () => {
  let component: ResolucionConcesionConRequerimientoAdrIsbaComponent;
  let fixture: ComponentFixture<ResolucionConcesionConRequerimientoAdrIsbaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResolucionConcesionConRequerimientoAdrIsbaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResolucionConcesionConRequerimientoAdrIsbaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
