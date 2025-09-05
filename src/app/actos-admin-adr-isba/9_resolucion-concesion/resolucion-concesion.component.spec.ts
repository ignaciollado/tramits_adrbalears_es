import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolucionConcesionAdrIsbaComponent } from './resolucion-concesion.component';

describe('ResolucionConcesionAdrIsbaComponent', () => {
  let component: ResolucionConcesionAdrIsbaComponent;
  let fixture: ComponentFixture<ResolucionConcesionAdrIsbaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResolucionConcesionAdrIsbaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResolucionConcesionAdrIsbaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
