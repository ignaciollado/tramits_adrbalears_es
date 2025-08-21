import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformeDesfavorableIlsComponent } from './informe-desfavorable.component';

describe('InformeDesfavorableIlsComponent', () => {
  let component: InformeDesfavorableIlsComponent;
  let fixture: ComponentFixture<InformeDesfavorableIlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformeDesfavorableIlsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InformeDesfavorableIlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
