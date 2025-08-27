import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrDefinitivaDesfavorableComponent } from './pr-definitiva-desfavorable.component';

describe('PrDefinitivaDesfavorableComponent', () => {
  let component: PrDefinitivaDesfavorableComponent;
  let fixture: ComponentFixture<PrDefinitivaDesfavorableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrDefinitivaDesfavorableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrDefinitivaDesfavorableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
