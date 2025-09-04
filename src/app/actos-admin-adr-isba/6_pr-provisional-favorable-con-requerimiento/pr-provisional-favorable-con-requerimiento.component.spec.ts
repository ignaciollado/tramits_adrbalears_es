import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrProvisionalFavorableConRequerimientoAdrIsbaComponent } from './pr-provisional-favorable-con-requerimiento.component';

describe('PrProvisionalFavorableConRequerimientoAdrIsbaComponent', () => {
  let component: PrProvisionalFavorableConRequerimientoAdrIsbaComponent;
  let fixture: ComponentFixture<PrProvisionalFavorableConRequerimientoAdrIsbaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrProvisionalFavorableConRequerimientoAdrIsbaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrProvisionalFavorableConRequerimientoAdrIsbaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
