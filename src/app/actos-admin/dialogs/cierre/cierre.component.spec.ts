import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogCierreComponent } from './cierre.component';

describe('DialogCierreComponent', () => {
  let component: DialogCierreComponent;
  let fixture: ComponentFixture<DialogCierreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogCierreComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DialogCierreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
