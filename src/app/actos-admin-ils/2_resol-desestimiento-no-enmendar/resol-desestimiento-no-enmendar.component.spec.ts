import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolDesestimientoNoEnmendarIlsComponent } from './resol-desestimiento-no-enmendar.component';

describe('ResolDesestimientoNoEnmendarIlsComponent', () => {
  let component: ResolDesestimientoNoEnmendarIlsComponent;
  let fixture: ComponentFixture<ResolDesestimientoNoEnmendarIlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResolDesestimientoNoEnmendarIlsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResolDesestimientoNoEnmendarIlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
