import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReportSchedulerService } from 'src/reports/report-scheduler.service';
import { CreateReportTemplateDto } from './create-report-template.dto';
import {
  OutputFormat,
  Prisma,
  ReportTemplate,
  ReportType,
  ScheduleFrequency,
} from '@prisma/client';
import { UpdateReportTemplateDto } from './update-report-template.dto';

export interface ReportTemplateResponse {
  id: string;
  name: string;
  reportType: ReportType;
  scheduleFrequency: ScheduleFrequency;
  specificTimeToRun: string;
  dayOfWeek: number | null;
  outputFormat: OutputFormat;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ReportTemplateService {
  private readonly logger = new Logger(ReportTemplateService.name);

  constructor(
    private prismaService: PrismaService,
    private reportSchedulerService: ReportSchedulerService,
  ) {}

  //   async createReportTemplate(
  //     payload: CreateReportTemplateDto,
  //   ): Promise<{ message: string; reportTemplate: ReportTemplate }> {
  //     this.logger.log('creating report template');
  //     try {
  //       const reportTemplate = await this.prismaService.reportTemplate.create({
  //         data: {
  //           name: payload.name,
  //           reportType: payload.reportType,
  //           scheduleFrequency: payload.scheduleFrequency,
  //           specificTimeToRun: payload.specificTimeToRun,
  //           dayOfWeek: payload.dayOfWeek,
  //           outputFormat: payload.outputFormat,
  //         },
  //       });
  //       this.reportSchedulerService.registerJob(reportTemplate);
  //       this.logger.log('Report template is created successfully');
  //       return {
  //         message: 'Report Template Created Successfully',
  //         reportTemplate: reportTemplate,
  //       };
  //     } catch (error: unknown) {
  //       this.logger.error(
  //         `Failed to create report template: ${payload.name}`,
  //         error instanceof Error ? error.stack : String(error),
  //       );
  //       if (error instanceof HttpException) {
  //         throw error;
  //       }
  //       if (
  //         error instanceof Prisma.PrismaClientKnownRequestError &&
  //         error.code === 'P2003'
  //       ) {
  //         throw new BadRequestException(
  //           'A record with this information already exists',
  //         );
  //       }
  //       throw new InternalServerErrorException(
  //         'Something went wrong while creating report template',
  //       );
  //     }
  //   }

  async createReportTemplate(
    payload: CreateReportTemplateDto,
  ): Promise<{ message: string; reportTemplate: ReportTemplateResponse }> {
    this.logger.log('creating report template');
    try {
        const reportTemplate = await this.prismaService.reportTemplate.create({
          data: {
            name: payload.name,
            reportType: payload.reportType,
            scheduleFrequency: payload.scheduleFrequency,
            specificTimeToRun: this.convertTime(payload.specificTimeToRun),
            dayOfWeek: payload.dayOfWeek,
            outputFormat: payload.outputFormat,
          },
        });
        const reportTemplateResponse = {
          ...reportTemplate,
          specificTimeToRun: this.formatTime(reportTemplate.specificTimeToRun),
        };
        this.reportSchedulerService.registerJob(reportTemplate);
        this.logger.log('Report template is created successfully');
        return {
          message: 'Report Template Created Successfully',
          reportTemplate: reportTemplateResponse,
        };
    } catch (error: unknown) {
      this.logger.error(
        `Failed to create report template: ${payload.name}`,
        error instanceof Error ? error.stack : String(error),
      );
      if (error instanceof HttpException) {
        throw error;
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'A record with this information already exists',
        );
      }
      throw new InternalServerErrorException(
        'Something went wrong while creating report template',
      );
    }
  }

  async findAllReportTemplate(search?: string): Promise<ReportTemplate[]> {
    this.logger.log('Fetching all report templates');
    try {
      const reportTemplates = await this.prismaService.reportTemplate.findMany({
        where: search ? {name : {contains: search, mode: 'insensitive'}}: {},
        orderBy: {
          createdAt: 'desc',
        },
      });
      return reportTemplates;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error('Error fetching report templates', error.stack);
      } else {
        this.logger.error('Error fetching report templates.');
      }
      throw new InternalServerErrorException(
        'Failed to fetch report templates.',
      );
    }
  }

  async getReportTemplateById(id: string): Promise<ReportTemplate> {
    this.logger.log(`Fetching report template by id: ${id}`);
    try {
      const reportTemplateById =
        await this.prismaService.reportTemplate.findUnique({
          where: { id },
        });
      if (!reportTemplateById) {
        this.logger.warn(`Report template not found for this id: ${id}`);
        throw new NotFoundException('Report Template Not Found');
      }
      this.logger.log(`Report Template fetched sucessfully with id: ${id}`);
      return reportTemplateById;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Error fetching report template with id: ${id} ${error.message}`,
        );
      } else {
        this.logger.error(
          `Error fetching report template with id: ${id} ${String(error)}`,
        );
      }

      throw new InternalServerErrorException('Failed to fetch report template');
    }
  }

  async updateReportTemplate(
    id: string,
    payload: UpdateReportTemplateDto,
  ): Promise<{ message: string; reportTemplate: ReportTemplate }> {
    this.logger.log(`updating the report template with id: ${id}`);
    try {
      const exisitngReportTemplate =
        await this.prismaService.reportTemplate.findUnique({
          where: { id },
        });
      if (!exisitngReportTemplate) {
        this.logger.warn(`Report Template not found for id: ${id}`);
        throw new NotFoundException('Report Template not found');
      }
      const updateData = Object.fromEntries(
        Object.entries(payload).filter(([_, value]) => value !== undefined),
      );
      if (payload.specificTimeToRun) {
        updateData.specificTimeToRun = this.convertTime(
          payload.specificTimeToRun,
        );
      }
      const updateReportTemplate =
        await this.prismaService.reportTemplate.update({
          where: { id },
          data: updateData,
        });
      this.logger.log(`Report template updated successfully with Id: ${id}`);
      return {
        message: 'Report Template Updated Successfully',
        reportTemplate: updateReportTemplate,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Error updating report template with id: ${id} ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(
          `Error updating report template with id: ${id} ${String(error)}`,
        );
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update report template',
      );
    }
  }

  async deleteReportTemplate(id: string): Promise<{ message: string }> {
    this.logger.log(`Delete Report Template id: ${id}`);
    try {
      
        const deleteReportTemplate = await this.prismaService.reportTemplate.findUnique({
          where: { id },
        });
        if (!deleteReportTemplate) {
          throw new NotFoundException('Report Template not found');
        }
        await this.prismaService.reportTemplate.delete({
          where: { id },
        });
        this.reportSchedulerService.unregisterJob(id);
        return { message: 'Report Template successfully deleted' };
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Error deleting report template ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(`Error deleting report template ${String(error)}`);
      }
      throw new InternalServerErrorException('Delete failed');
    }
  }

  async toggleStatus(
    id: string,
  ): Promise<{ message: string; reportTemplate: ReportTemplate }> {
    try {
      this.logger.log(`Change the status for report template: ${id}`);
      const reportTemplate = await this.prismaService.reportTemplate.findUnique(
        {
          where: { id },
        },
      );
      const updateStatus = await this.prismaService.reportTemplate.update({
        where: { id },
        data: { isActive: !reportTemplate?.isActive },
      });
      if(updateStatus.isActive){
        this.reportSchedulerService.registerJob(updateStatus)
      }else{
        this.reportSchedulerService.unregisterJob(updateStatus.id)
      }
      this.logger.log(`Report template updated successfully with Id: ${id}`);
      return {
        message: 'Report Template Updated Successfully',
        reportTemplate: updateStatus,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Error updating report template with id: ${id} ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(
          `Error updating report template with id: ${id} ${String(error)}`,
        );
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update report template',
      );
    }
  }

  convertTime(time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0, 0));
  }

  formatTime(date: Date): string {
    return date.toISOString().substring(11, 16);
  }
}
