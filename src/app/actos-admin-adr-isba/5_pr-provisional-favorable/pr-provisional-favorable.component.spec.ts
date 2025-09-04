import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrProvisionalFavorableAdrIsbaComponent } from './pr-provisional-favorable.component';

describe('PrProvisionalFavorableAdrIsbaComponent', () => {
  let component: PrProvisionalFavorableAdrIsbaComponent;
  let fixture: ComponentFixture<PrProvisionalFavorableAdrIsbaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrProvisionalFavorableAdrIsbaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrProvisionalFavorableAdrIsbaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
