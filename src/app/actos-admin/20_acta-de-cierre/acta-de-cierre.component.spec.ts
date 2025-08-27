import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActaDeCierreComponent } from './acta-de-cierre.component';

describe('ActaDeCierreComponent', () => {
  let component: ActaDeCierreComponent;
  let fixture: ComponentFixture<ActaDeCierreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActaDeCierreComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ActaDeCierreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
