import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolucionRevocacionIlsComponent } from './resolucion-revocacion.component';

describe('ResolucionRevocacionIlsComponent', () => {
  let component: ResolucionRevocacionIlsComponent;
  let fixture: ComponentFixture<ResolucionRevocacionIlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResolucionRevocacionIlsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResolucionRevocacionIlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
