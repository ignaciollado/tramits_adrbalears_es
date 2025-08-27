import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrProvisionalFavorableComponent } from './pr-provisional-favorable.component';

describe('PrProvisionalFavorableComponent', () => {
  let component: PrProvisionalFavorableComponent;
  let fixture: ComponentFixture<PrProvisionalFavorableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrProvisionalFavorableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrProvisionalFavorableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
