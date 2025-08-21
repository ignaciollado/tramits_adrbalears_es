import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MejorasSolicitudDetalleAdrIsbaComponent } from './mejoras-solicitud-detalle.component';

describe('MejorasSolicitudDetalleAdrIsbaComponent', () => {
  let component: MejorasSolicitudDetalleAdrIsbaComponent;
  let fixture: ComponentFixture<MejorasSolicitudDetalleAdrIsbaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MejorasSolicitudDetalleAdrIsbaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MejorasSolicitudDetalleAdrIsbaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
