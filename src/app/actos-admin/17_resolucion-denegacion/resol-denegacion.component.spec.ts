import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolDenegacionComponent } from './resol-denegacion.component';

describe('ResolDenegacionComponent', () => {
  let component: ResolDenegacionComponent;
  let fixture: ComponentFixture<ResolDenegacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResolDenegacionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResolDenegacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
