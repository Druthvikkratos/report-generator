import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ReportTemplate } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { buildCornExpression } from './cron-expression.util';
import { CronJob } from 'cron';

@Injectable()
export class ReportSchedulerService implements OnModuleInit{

    private readonly logger = new Logger(ReportSchedulerService.name);
    private readonly jobPrefix = 'report-template';

    constructor(private prismaService: PrismaService, private scheduleRegistry: SchedulerRegistry){
    }

    async onModuleInit(){
       const activeTemplates = await this.prismaService.reportTemplate.findMany({
        where: {
            isActive: true
        },
       })

       for(const template of activeTemplates){
        this.registerJob(template);
       }
       this.logger.log(`Registered ${activeTemplates.length} report schedules on startup`);
    }

    registerJob(template: ReportTemplate): void {
        const jobName = this.jobPrefix + template.id;
        if(this.scheduleRegistry.doesExist('cron', jobName)){
            this.scheduleRegistry.deleteCronJob(jobName)
        }
        const cronExpression = buildCornExpression(template.scheduleFrequency, template.specificTimeToRun, template.dayOfWeek);
        const job = new CronJob(cronExpression, () => {
            this.logger.log(`Triggered scheduled run for template ${template.id} (${template.name})`)
        })

        this.scheduleRegistry.addCronJob(jobName, job)
        job.start();
        this.logger.log(`Registered job "${jobName}" with cron "${cronExpression}" for template "${template.name}"`)
    }

    unregisterJob(templateId: string): void{
        const jobName = this.jobPrefix + templateId
        if(this.scheduleRegistry.doesExist('cron', jobName)){
            this.scheduleRegistry.deleteCronJob(jobName)
            this.logger.log(`Unregistered job "${jobName}"`)
        }
    }
}
