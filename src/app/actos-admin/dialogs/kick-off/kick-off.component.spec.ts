import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogKickOffComponent } from './kick-off.component';

describe('DialogKickOffComponent', () => {
  let component: DialogKickOffComponent;
  let fixture: ComponentFixture<DialogKickOffComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogKickOffComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DialogKickOffComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
