import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrDefinitivaFavorableConRequerimientoAdrIsbaComponent } from './pr-definitiva-favorable-con-requerimiento.component';

describe('PrDefinitivaFavorableConRequerimientoAdrIsbaComponent', () => {
  let component: PrDefinitivaFavorableConRequerimientoAdrIsbaComponent;
  let fixture: ComponentFixture<PrDefinitivaFavorableConRequerimientoAdrIsbaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrDefinitivaFavorableConRequerimientoAdrIsbaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrDefinitivaFavorableConRequerimientoAdrIsbaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
