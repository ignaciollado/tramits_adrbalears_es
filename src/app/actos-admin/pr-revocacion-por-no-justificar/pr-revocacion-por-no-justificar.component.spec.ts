import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrRevocacionPorNoJustificarComponent } from './pr-revocacion-por-no-justificar.component';

describe('PrRevocacionPorNoJustificarComponent', () => {
  let component: PrRevocacionPorNoJustificarComponent;
  let fixture: ComponentFixture<PrRevocacionPorNoJustificarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrRevocacionPorNoJustificarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrRevocacionPorNoJustificarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
