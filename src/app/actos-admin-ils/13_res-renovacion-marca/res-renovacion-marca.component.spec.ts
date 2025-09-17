import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResRenovacionMarcaIlsComponent } from './res-renovacion-marca.component';

describe('ResRenovacionMarcaIlsComponent', () => {
  let component: ResRenovacionMarcaIlsComponent;
  let fixture: ComponentFixture<ResRenovacionMarcaIlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResRenovacionMarcaIlsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResRenovacionMarcaIlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
