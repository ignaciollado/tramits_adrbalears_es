import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrDefinitivaFavorableConRequerimientoComponent } from './pr-definitiva-favorable-con-requerimiento.component';

describe('PrDefinitivaFavorableConRequerimientoComponent', () => {
  let component: PrDefinitivaFavorableConRequerimientoComponent;
  let fixture: ComponentFixture<PrDefinitivaFavorableConRequerimientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrDefinitivaFavorableConRequerimientoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrDefinitivaFavorableConRequerimientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
