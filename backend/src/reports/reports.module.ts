import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportSchedulerService } from './report-scheduler.service';

@Module({
  providers: [ReportsService, ReportSchedulerService],
  exports: [ReportSchedulerService],
})
export class ReportsModule {}
