import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeclaracionResponsableIlsComponent } from './declaracion-responsable.component';

describe('DeclaracionResponsableIlsComponent', () => {
  let component: DeclaracionResponsableIlsComponent;
  let fixture: ComponentFixture<DeclaracionResponsableIlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeclaracionResponsableIlsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DeclaracionResponsableIlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
