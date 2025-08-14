import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformeFavorableConRequerimientoComponent } from './informe-favorable-con-requerimiento.component';

describe('InformeFavorableConRequerimientoComponent', () => {
  let component: InformeFavorableConRequerimientoComponent;
  let fixture: ComponentFixture<InformeFavorableConRequerimientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformeFavorableConRequerimientoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InformeFavorableConRequerimientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
