import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigurationLineDetailComponent } from './configuration-line-detail.component';

describe('ConfigurationLineDetailComponent', () => {
  let component: ConfigurationLineDetailComponent;
  let fixture: ComponentFixture<ConfigurationLineDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigurationLineDetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConfigurationLineDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
