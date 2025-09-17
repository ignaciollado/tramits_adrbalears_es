import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResRenovacionMarcaConRequerimientoIlsComponent } from './res-renovacion-marca-con-requerimiento.component';

describe('ResRenovacionMarcaConRequerimientoIlsComponent', () => {
  let component: ResRenovacionMarcaConRequerimientoIlsComponent;
  let fixture: ComponentFixture<ResRenovacionMarcaConRequerimientoIlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResRenovacionMarcaConRequerimientoIlsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResRenovacionMarcaConRequerimientoIlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
