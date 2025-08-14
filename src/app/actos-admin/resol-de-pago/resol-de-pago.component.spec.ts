import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolDePagoComponent } from './resol-de-pago.component';

describe('ResolDePagoComponent', () => {
  let component: ResolDePagoComponent;
  let fixture: ComponentFixture<ResolDePagoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResolDePagoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResolDePagoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
