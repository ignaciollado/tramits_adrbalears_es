import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrDefinitivaFavorableComponent } from './pr-definitiva-favorable.component';

describe('PrDefinitivaFavorableComponent', () => {
  let component: PrDefinitivaFavorableComponent;
  let fixture: ComponentFixture<PrDefinitivaFavorableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrDefinitivaFavorableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrDefinitivaFavorableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
