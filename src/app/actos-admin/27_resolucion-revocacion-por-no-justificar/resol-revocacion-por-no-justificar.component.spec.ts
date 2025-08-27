import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolRevocacionPorNoJustificarComponent } from './resol-revocacion-por-no-justificar.component';

describe('ResolRevocacionPorNoJustificarComponent', () => {
  let component: ResolRevocacionPorNoJustificarComponent;
  let fixture: ComponentFixture<ResolRevocacionPorNoJustificarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResolRevocacionPorNoJustificarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResolRevocacionPorNoJustificarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
