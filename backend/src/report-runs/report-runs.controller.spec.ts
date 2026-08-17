import { Test, TestingModule } from '@nestjs/testing';
import { ReportRunsController } from './report-runs.controller';

describe('ReportRunsController', () => {
  let controller: ReportRunsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportRunsController],
    }).compile();

    controller = module.get<ReportRunsController>(ReportRunsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
