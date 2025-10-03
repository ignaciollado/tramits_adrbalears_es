import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RenovInformeDesfavorableConRequerimientoIlsComponent } from './renov-informe-desfavorable-con-requerimiento.component';

describe('RenovInformeDesfavorableConRequerimientoIlsComponent', () => {
  let component: RenovInformeDesfavorableConRequerimientoIlsComponent;
  let fixture: ComponentFixture<RenovInformeDesfavorableConRequerimientoIlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RenovInformeDesfavorableConRequerimientoIlsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RenovInformeDesfavorableConRequerimientoIlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
