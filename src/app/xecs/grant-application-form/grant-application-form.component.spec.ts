import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GrantApplicationFormComponent } from './grant-application-form.component';

describe('GrantApplicationFormComponent', () => {
  let component: GrantApplicationFormComponent;
  let fixture: ComponentFixture<GrantApplicationFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GrantApplicationFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GrantApplicationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
