import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrDefinitivaFavorableAdrIsbaComponent } from './pr-definitiva-favorable.component';

describe('PrDefinitivaFavorableAdrIsbaComponent', () => {
  let component: PrDefinitivaFavorableAdrIsbaComponent;
  let fixture: ComponentFixture<PrDefinitivaFavorableAdrIsbaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrDefinitivaFavorableAdrIsbaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrDefinitivaFavorableAdrIsbaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
