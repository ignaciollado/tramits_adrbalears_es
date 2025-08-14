import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrProvisionalDesfavorableConRequerimientoComponent } from './pr-provisional-desfavorable-con-requerimiento.component';

describe('PrProvisionalDesfavorableConRequerimientoComponent', () => {
  let component: PrProvisionalDesfavorableConRequerimientoComponent;
  let fixture: ComponentFixture<PrProvisionalDesfavorableConRequerimientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrProvisionalDesfavorableConRequerimientoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrProvisionalDesfavorableConRequerimientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
