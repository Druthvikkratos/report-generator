import { Module } from '@nestjs/common';
import { ReportTemplateService } from './report-template.service';
import { ReportTemplateController } from './report-template.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReportsModule } from 'src/reports/reports.module';

@Module({
   imports: [ReportsModule],
  providers: [ReportTemplateService, PrismaService],
  controllers: [ReportTemplateController],
  exports: [ReportTemplateService]
})
export class ReportTemplateModule {}
