import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformeFavorableConRequerimientoAdrIsbaComponent } from './informe-favorable-con-requerimiento.component';

describe('InformeFavorableConRequerimientoAdrIsbaComponent', () => {
  let component: InformeFavorableConRequerimientoAdrIsbaComponent;
  let fixture: ComponentFixture<InformeFavorableConRequerimientoAdrIsbaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformeFavorableConRequerimientoAdrIsbaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InformeFavorableConRequerimientoAdrIsbaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
