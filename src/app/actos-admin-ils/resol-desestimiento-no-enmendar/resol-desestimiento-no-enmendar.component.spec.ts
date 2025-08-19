import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolDesestimientoNoEnmendarComponent } from './resol-desestimiento-no-enmendar.component';

describe('ResolDesestimientoNoEnmendarComponent', () => {
  let component: ResolDesestimientoNoEnmendarComponent;
  let fixture: ComponentFixture<ResolDesestimientoNoEnmendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResolDesestimientoNoEnmendarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResolDesestimientoNoEnmendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
