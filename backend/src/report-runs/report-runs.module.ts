import { Module } from '@nestjs/common';
import { ReportRunsService } from './report-runs.service';
import { ReportRunsController } from './report-runs.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [ReportRunsService, PrismaService],
  controllers: [ReportRunsController]
})
export class ReportRunsModule {}
