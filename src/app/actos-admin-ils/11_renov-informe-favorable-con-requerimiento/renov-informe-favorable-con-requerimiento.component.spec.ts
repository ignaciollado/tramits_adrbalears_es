import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RenovInformeFavorableConRequerimientoIlsComponent } from './renov-informe-favorable-con-requerimiento.component';

describe('RenovInformeFavorableConRequerimientoIlsComponent', () => {
  let component: RenovInformeFavorableConRequerimientoIlsComponent;
  let fixture: ComponentFixture<RenovInformeFavorableConRequerimientoIlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RenovInformeFavorableConRequerimientoIlsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RenovInformeFavorableConRequerimientoIlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
