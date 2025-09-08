import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolucionRevocacionPorNoJustificarAdrIsbaComponent } from './resolucion-revocacion-por-no-justificar.component';

describe('ResolucionRevocacionPorNoJustificarAdrIsbaComponent', () => {
  let component: ResolucionRevocacionPorNoJustificarAdrIsbaComponent;
  let fixture: ComponentFixture<ResolucionRevocacionPorNoJustificarAdrIsbaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResolucionRevocacionPorNoJustificarAdrIsbaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResolucionRevocacionPorNoJustificarAdrIsbaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
