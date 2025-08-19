import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolDesestimientoNoEnmendarAdrIsbaComponent } from './resol-desestimiento-no-enmendar.component';

describe('ResolDesestimientoNoEnmendarComponent', () => {
  let component: ResolDesestimientoNoEnmendarAdrIsbaComponent;
  let fixture: ComponentFixture<ResolDesestimientoNoEnmendarAdrIsbaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResolDesestimientoNoEnmendarAdrIsbaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResolDesestimientoNoEnmendarAdrIsbaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
