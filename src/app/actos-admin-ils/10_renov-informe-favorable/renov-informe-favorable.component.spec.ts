import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RenovInformeFavorableIlsComponent } from './renov-informe-favorable.component';

describe('RenovInformeFavorableIlsComponent', () => {
  let component: RenovInformeFavorableIlsComponent;
  let fixture: ComponentFixture<RenovInformeFavorableIlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RenovInformeFavorableIlsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RenovInformeFavorableIlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
