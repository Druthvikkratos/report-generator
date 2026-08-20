import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ReportTemplateResponse,
  ReportTemplateService,
} from './report-template.service';
import { CreateReportTemplateDto } from './create-report-template.dto';
import { ReportTemplate } from '@prisma/client';
import { UpdateReportTemplateDto } from './update-report-template.dto';


@Controller('report-templates')
export class ReportTemplateController {
  constructor(private readonly reportTemplateService: ReportTemplateService,
  ) {}

  @Post()
  async createTemplate(
    @Body() payload: CreateReportTemplateDto,
  ): Promise<{ message: string; reportTemplate: ReportTemplateResponse }> {
    return this.reportTemplateService.createReportTemplate(payload);
  }

  @Get()
  getAllReportTemplates(@Query('search') search?: string): Promise<ReportTemplate[]> {
    return this.reportTemplateService.findAllReportTemplate(search);
  }

  @Get('/:id')
  getReportTemplateById(@Param('id') id: string): Promise<ReportTemplate> {
    return this.reportTemplateService.getReportTemplateById(id);
  }

  @Put('/:id')
  updateReportTemplate(
    @Param('id') id: string,
    @Body() payload: UpdateReportTemplateDto,
  ) {
    return this.reportTemplateService.updateReportTemplate(id, payload);
  }

  @Delete('/:id')
  deleteReportTemplate(@Param('id') id: string) {
    return this.reportTemplateService.deleteReportTemplate(id);
  }

  @Put('/:id/toggle-status')
  reportTemplateStatusChange(
    @Param('id') id: string,
  ): Promise<{ message: string; reportTemplate: ReportTemplate }> {
    return this.reportTemplateService.toggleStatus(id);
  }


}
