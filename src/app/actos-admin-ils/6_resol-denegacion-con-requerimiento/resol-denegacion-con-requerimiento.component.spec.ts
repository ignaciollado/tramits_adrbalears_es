import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolDenegacionConRequerimientoIlsComponent } from './resol-denegacion-con-requerimiento.component';

describe('ResolDenegacionConRequerimientoIlsComponent', () => {
  let component: ResolDenegacionConRequerimientoIlsComponent;
  let fixture: ComponentFixture<ResolDenegacionConRequerimientoIlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResolDenegacionConRequerimientoIlsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResolDenegacionConRequerimientoIlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
