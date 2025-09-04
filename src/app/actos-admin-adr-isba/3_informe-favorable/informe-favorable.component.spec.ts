import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformeFavorableAdrIsbaComponent } from './informe-favorable.component';

describe('InformeFavorableAdrIsbaComponent', () => {
  let component: InformeFavorableAdrIsbaComponent;
  let fixture: ComponentFixture<InformeFavorableAdrIsbaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformeFavorableAdrIsbaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InformeFavorableAdrIsbaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
