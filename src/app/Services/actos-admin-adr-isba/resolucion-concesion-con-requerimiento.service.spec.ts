import { TestBed } from '@angular/core/testing';

import { ResolucionConcesionConRequerimientoService } from './resolucion-concesion-con-requerimiento.service';

describe('ResolucionConcesionConRequerimientoService', () => {
  let service: ResolucionConcesionConRequerimientoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResolucionConcesionConRequerimientoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
