import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformePostEnmiendaJustificacionComponent } from './informe-post-enmienda-justificacion.component';

describe('InformePostEnmiendaJustificacionComponent', () => {
  let component: InformePostEnmiendaJustificacionComponent;
  let fixture: ComponentFixture<InformePostEnmiendaJustificacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformePostEnmiendaJustificacionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InformePostEnmiendaJustificacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
