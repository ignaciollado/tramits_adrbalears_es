import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigurationDetailComponent } from './configuration-detail.component';

describe('ConfigurationDetailComponent', () => {
  let component: ConfigurationDetailComponent;
  let fixture: ComponentFixture<ConfigurationDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigurationDetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConfigurationDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
