import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrProvisionalFavorableConRequerimientoComponent } from './pr-provisional-favorable-con-requerimiento.component';

describe('PrProvisionalFavorableConRequerimientoComponent', () => {
  let component: PrProvisionalFavorableConRequerimientoComponent;
  let fixture: ComponentFixture<PrProvisionalFavorableConRequerimientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrProvisionalFavorableConRequerimientoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrProvisionalFavorableConRequerimientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
