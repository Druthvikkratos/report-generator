import { TestBed } from '@angular/core/testing';

import { ReportRunService } from './report-run-service';

describe('ReportRunService', () => {
  let service: ReportRunService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReportRunService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
