import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformeFavorableComponent } from './informe-favorable.component';

describe('InformeFavorableComponent', () => {
  let component: InformeFavorableComponent;
  let fixture: ComponentFixture<InformeFavorableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformeFavorableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InformeFavorableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
