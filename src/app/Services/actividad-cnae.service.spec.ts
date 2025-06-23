import { TestBed } from '@angular/core/testing';

import { ActividadCnaeService } from './actividad-cnae.service';

describe('ActividadCnaeService', () => {
  let service: ActividadCnaeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActividadCnaeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
