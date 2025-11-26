import { TestBed } from '@angular/core/testing';

import { PrDefinitivaFavorableConRequerimientoService } from './pr-definitiva-favorable-con-requerimiento.service';

describe('PrDefinitivaFavorableConRequerimientoService', () => {
  let service: PrDefinitivaFavorableConRequerimientoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrDefinitivaFavorableConRequerimientoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
