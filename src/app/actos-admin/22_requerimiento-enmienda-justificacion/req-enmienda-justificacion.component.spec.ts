import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReqEnmiendaJustificacionComponent } from './req-enmienda-justificacion.component';

describe('ReqEnmiendaJustificacionComponent', () => {
  let component: ReqEnmiendaJustificacionComponent;
  let fixture: ComponentFixture<ReqEnmiendaJustificacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReqEnmiendaJustificacionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReqEnmiendaJustificacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
