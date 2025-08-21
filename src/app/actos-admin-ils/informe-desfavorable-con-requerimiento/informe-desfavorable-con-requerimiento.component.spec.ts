import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformeDesfavorableConRequerimientoIlsComponent } from './informe-desfavorable-con-requerimiento.component';

describe('InformeDesfavorableConRequerimientoIlsComponent', () => {
  let component: InformeDesfavorableConRequerimientoIlsComponent;
  let fixture: ComponentFixture<InformeDesfavorableConRequerimientoIlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformeDesfavorableConRequerimientoIlsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InformeDesfavorableConRequerimientoIlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
