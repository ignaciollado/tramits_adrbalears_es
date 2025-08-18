import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MejorasSolicitudDetalleComponent } from './mejoras-solicitud-detalle.component';

describe('MejorasSolicitudDetalleComponent', () => {
  let component: MejorasSolicitudDetalleComponent;
  let fixture: ComponentFixture<MejorasSolicitudDetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MejorasSolicitudDetalleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MejorasSolicitudDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
