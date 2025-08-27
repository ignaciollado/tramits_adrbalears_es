import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolDenegacionConRequerimientoComponent } from './resol-denegacion-con-requerimiento.component';

describe('ResolDenegacionConRequerimientoComponent', () => {
  let component: ResolDenegacionConRequerimientoComponent;
  let fixture: ComponentFixture<ResolDenegacionConRequerimientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResolDenegacionConRequerimientoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResolDenegacionConRequerimientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
