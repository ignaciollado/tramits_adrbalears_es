import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrProvisionalDesfavorableComponent } from './pr-provisional-desfavorable.component';

describe('PrProvisionalDesfavorableComponent', () => {
  let component: PrProvisionalDesfavorableComponent;
  let fixture: ComponentFixture<PrProvisionalDesfavorableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrProvisionalDesfavorableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrProvisionalDesfavorableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
