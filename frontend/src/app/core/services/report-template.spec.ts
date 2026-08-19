import { TestBed } from '@angular/core/testing';

import { ReportTemplate } from './report-template';

describe('ReportTemplate', () => {
  let service: ReportTemplate;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReportTemplate);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
