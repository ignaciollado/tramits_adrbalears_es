import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformeDesfavorableConRequerimientoComponent } from './informe-desfavorable-con-requerimiento.component';

describe('InformeDesfavorableConRequerimientoComponent', () => {
  let component: InformeDesfavorableConRequerimientoComponent;
  let fixture: ComponentFixture<InformeDesfavorableConRequerimientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformeDesfavorableConRequerimientoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InformeDesfavorableConRequerimientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
