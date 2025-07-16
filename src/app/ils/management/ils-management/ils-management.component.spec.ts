import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IlsManagementComponent } from './ils-management.component';

describe('IlsManagementComponent', () => {
  let component: IlsManagementComponent;
  let fixture: ComponentFixture<IlsManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IlsManagementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IlsManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
