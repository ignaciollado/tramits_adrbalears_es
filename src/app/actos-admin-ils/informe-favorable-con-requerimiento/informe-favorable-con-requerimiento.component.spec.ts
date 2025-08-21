import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformeFavorableConRequerimientoIlsComponent } from './informe-favorable-con-requerimiento.component';

describe('InformeFavorableConRequerimientoIlsComponent', () => {
  let component: InformeFavorableConRequerimientoIlsComponent;
  let fixture: ComponentFixture<InformeFavorableConRequerimientoIlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformeFavorableConRequerimientoIlsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InformeFavorableConRequerimientoIlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
