import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolucionDePagoYJustificacionAdrIsbaComponent } from './resolucion-de-pago-y-justificacion.component';

describe('ResolucionDePagoYJustificacionAdrIsbaComponent', () => {
  let component: ResolucionDePagoYJustificacionAdrIsbaComponent;
  let fixture: ComponentFixture<ResolucionDePagoYJustificacionAdrIsbaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResolucionDePagoYJustificacionAdrIsbaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResolucionDePagoYJustificacionAdrIsbaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
