import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrDefinitivaDesfavorableConRequerimientoComponent } from './pr-definitiva-desfavorable-con-requerimiento.component';

describe('PrDefinitivaDesfavorableConRequerimientoComponent', () => {
  let component: PrDefinitivaDesfavorableConRequerimientoComponent;
  let fixture: ComponentFixture<PrDefinitivaDesfavorableConRequerimientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrDefinitivaDesfavorableConRequerimientoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrDefinitivaDesfavorableConRequerimientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
