import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolConcesionAdhesionIlsComponent } from './resol-concesion-adhesion.component';

describe('ResolConcesionAdhesionIlsComponent', () => {
  let component: ResolConcesionAdhesionIlsComponent;
  let fixture: ComponentFixture<ResolConcesionAdhesionIlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResolConcesionAdhesionIlsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResolConcesionAdhesionIlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
