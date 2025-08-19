import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequerimientoAdrIsbaComponent } from './requerimiento.component';

describe('RequerimientoAdrIsbaComponent', () => {
  let component: RequerimientoAdrIsbaComponent;
  let fixture: ComponentFixture<RequerimientoAdrIsbaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequerimientoAdrIsbaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RequerimientoAdrIsbaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
