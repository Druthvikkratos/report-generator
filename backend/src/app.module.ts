import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ReportsModule } from './reports/reports.module';
import { ReportTemplateModule } from './report-template/report-template.module';
import { ReportRunsModule } from './report-runs/report-runs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    ReportsModule,
    ReportTemplateModule,
    ReportRunsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
