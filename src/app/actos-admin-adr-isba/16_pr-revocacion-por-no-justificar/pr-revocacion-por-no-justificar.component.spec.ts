import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrRevocacionPorNoJustificarAdrIsbaComponent } from './pr-revocacion-por-no-justificar.component';

describe('PrRevocacionPorNoJustificarAdrIsbaComponent', () => {
  let component: PrRevocacionPorNoJustificarAdrIsbaComponent;
  let fixture: ComponentFixture<PrRevocacionPorNoJustificarAdrIsbaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrRevocacionPorNoJustificarAdrIsbaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrRevocacionPorNoJustificarAdrIsbaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
