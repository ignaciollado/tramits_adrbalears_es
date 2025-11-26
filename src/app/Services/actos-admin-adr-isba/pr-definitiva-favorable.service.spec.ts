import { TestBed } from '@angular/core/testing';

import { PrDefinitivaFavorableService } from './pr-definitiva-favorable.service';

describe('PrDefinitivaFavorableService', () => {
  let service: PrDefinitivaFavorableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrDefinitivaFavorableService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
