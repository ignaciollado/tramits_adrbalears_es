import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModeloSeguimientoIlsComponent } from './modelo-seguimiento.component';

describe('ModeloSeguimientoIlsComponent', () => {
  let component: ModeloSeguimientoIlsComponent;
  let fixture: ComponentFixture<ModeloSeguimientoIlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModeloSeguimientoIlsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModeloSeguimientoIlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
