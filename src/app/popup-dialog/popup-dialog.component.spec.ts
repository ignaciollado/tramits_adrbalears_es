import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopUpDialogComponent } from './popup-dialog.component';

describe('PopUpDialogComponent', () => {
  let component: PopUpDialogComponent;
  let fixture: ComponentFixture<PopUpDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PopUpDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopUpDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
