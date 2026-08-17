import { Test, TestingModule } from '@nestjs/testing';
import { ReportRunsService } from './report-runs.service';

describe('ReportRunsService', () => {
  let service: ReportRunsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportRunsService],
    }).compile();

    service = module.get<ReportRunsService>(ReportRunsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
