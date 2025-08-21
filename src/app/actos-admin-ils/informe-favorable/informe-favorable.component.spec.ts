import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformeFavorableIlsComponent } from './informe-favorable.component';

describe('InformeFavorableIlsComponent', () => {
  let component: InformeFavorableIlsComponent;
  let fixture: ComponentFixture<InformeFavorableIlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformeFavorableIlsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InformeFavorableIlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
