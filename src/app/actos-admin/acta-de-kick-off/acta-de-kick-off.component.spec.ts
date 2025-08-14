import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActaDeKickOffComponent } from './acta-de-kick-off.component';

describe('ActaDeKickOffComponent', () => {
  let component: ActaDeKickOffComponent;
  let fixture: ComponentFixture<ActaDeKickOffComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActaDeKickOffComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ActaDeKickOffComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
