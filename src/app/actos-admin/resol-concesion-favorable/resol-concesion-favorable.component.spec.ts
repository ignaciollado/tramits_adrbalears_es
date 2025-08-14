import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolConcesionFavorableComponent } from './resol-concesion-favorable.component';

describe('ResolConcesionFavorableComponent', () => {
  let component: ResolConcesionFavorableComponent;
  let fixture: ComponentFixture<ResolConcesionFavorableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResolConcesionFavorableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResolConcesionFavorableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
