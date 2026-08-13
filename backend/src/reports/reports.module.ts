import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportSchedulerService } from './report-scheduler.service';
import { ReportGeneratorService } from './report-generator.service';

@Module({
  providers: [ReportsService, ReportSchedulerService, ReportGeneratorService],
  exports: [ReportSchedulerService, ReportGeneratorService],
})
export class ReportsModule {}
