import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XecsManagementComponent } from './xecs-management.component';

describe('XecsManagementComponent', () => {
  let component: XecsManagementComponent;
  let fixture: ComponentFixture<XecsManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [XecsManagementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(XecsManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
