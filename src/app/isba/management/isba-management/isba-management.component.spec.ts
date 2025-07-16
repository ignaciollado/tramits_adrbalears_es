import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IsbaManagementComponent } from './isba-management.component';

describe('IsbaManagementComponent', () => {
  let component: IsbaManagementComponent;
  let fixture: ComponentFixture<IsbaManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IsbaManagementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IsbaManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
