import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformeDesfavorableComponent } from './informe-desfavorable.component';

describe('InformeDesfavorableComponent', () => {
  let component: InformeDesfavorableComponent;
  let fixture: ComponentFixture<InformeDesfavorableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformeDesfavorableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InformeDesfavorableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
