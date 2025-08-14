import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolDesestimientoPorRenunciaComponent } from './resol-desestimiento-por-renuncia.component';

describe('ResolDesestimientoPorRenunciaComponent', () => {
  let component: ResolDesestimientoPorRenunciaComponent;
  let fixture: ComponentFixture<ResolDesestimientoPorRenunciaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResolDesestimientoPorRenunciaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResolDesestimientoPorRenunciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
