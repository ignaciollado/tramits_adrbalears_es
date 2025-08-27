import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolConcesionFavorableConRequerimientoComponent } from './resol-concesion-favorable-con-requerimiento.component';

describe('ResolConcesionFavorableConRequerimientoComponent', () => {
  let component: ResolConcesionFavorableConRequerimientoComponent;
  let fixture: ComponentFixture<ResolConcesionFavorableConRequerimientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResolConcesionFavorableConRequerimientoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResolConcesionFavorableConRequerimientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
