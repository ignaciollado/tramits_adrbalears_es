import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeclaracionResponsableComponent } from './declaracion-responsable.component';

describe('DeclaracionResponsableComponent', () => {
  let component: DeclaracionResponsableComponent;
  let fixture: ComponentFixture<DeclaracionResponsableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeclaracionResponsableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DeclaracionResponsableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
