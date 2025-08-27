import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigurationLineListComponent } from './configuration-line-list.component';

describe('ConfigurationLineListComponent', () => {
  let component: ConfigurationLineListComponent;
  let fixture: ComponentFixture<ConfigurationLineListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigurationLineListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConfigurationLineListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
