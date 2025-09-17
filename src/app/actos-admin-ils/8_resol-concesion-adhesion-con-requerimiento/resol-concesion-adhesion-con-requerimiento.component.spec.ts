import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolConcesionAdhesionConRequerimientoIlsComponent } from './resol-concesion-adhesion-con-requerimiento.component';

describe('ResolConcesionAdhesionConRequerimientoIlsComponent', () => {
  let component: ResolConcesionAdhesionConRequerimientoIlsComponent;
  let fixture: ComponentFixture<ResolConcesionAdhesionConRequerimientoIlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResolConcesionAdhesionConRequerimientoIlsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResolConcesionAdhesionConRequerimientoIlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
