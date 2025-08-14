import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformeInicioReqJustificacionComponent } from './informe-inicio-req-justificacion.component';

describe('InformeInicioReqJustificacionComponent', () => {
  let component: InformeInicioReqJustificacionComponent;
  let fixture: ComponentFixture<InformeInicioReqJustificacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformeInicioReqJustificacionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InformeInicioReqJustificacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
