import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequerimientoIlsComponent } from './requerimiento.component';

describe('RequerimientoComponent', () => {
  let component: RequerimientoIlsComponent;
  let fixture: ComponentFixture<RequerimientoIlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequerimientoIlsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RequerimientoIlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
