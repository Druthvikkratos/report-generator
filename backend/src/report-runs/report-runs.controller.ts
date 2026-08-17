import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ReportRunsService } from './report-runs.service';
import type { Response } from 'express';
import { createReadStream } from 'fs';

@Controller('report-runs')
export class ReportRunsController {
  constructor(private reportRunService: ReportRunsService) {}

  @Get()
  findAll(@Query('templateId') templateId?: string) {
    return this.reportRunService.findAll(templateId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportRunService.findOne(id);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const { filePath, fileName } =
      await this.reportRunService.getDownloadableFile(id);
    res.set({
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);
  }
}
