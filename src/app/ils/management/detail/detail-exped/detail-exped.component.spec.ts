import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailExpedComponent } from './detail-exped.component';

describe('DetailExpedComponent', () => {
  let component: DetailExpedComponent;
  let fixture: ComponentFixture<DetailExpedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailExpedComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DetailExpedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
