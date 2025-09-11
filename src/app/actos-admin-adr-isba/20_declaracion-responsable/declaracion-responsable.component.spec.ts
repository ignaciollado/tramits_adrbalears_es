import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeclaracionResponsableAdrIsbaComponent } from './declaracion-responsable.component';

describe('DeclaracionResponsableAdrIsbaComponent', () => {
  let component: DeclaracionResponsableAdrIsbaComponent;
  let fixture: ComponentFixture<DeclaracionResponsableAdrIsbaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeclaracionResponsableAdrIsbaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DeclaracionResponsableAdrIsbaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
