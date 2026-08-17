import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { fstat } from 'fs';
import { PrismaService } from 'src/prisma/prisma.service';
import * as fs from 'fs';

@Injectable()
export class ReportRunsService {
  private readonly logger = new Logger(ReportRunsService.name);

  constructor(private prismaService: PrismaService) {}

  async findAll(templateId?: string) {
    this.logger.log('Fetching report runs');
    return this.prismaService.reportRun.findMany({
      where: templateId ? { reportTemplateId: templateId } : {},
      include: {
        reportTemplate: {
          select: {
            name: true,
            outputFormat: true,
          },
        },
      },
      orderBy: { runStarted: 'desc' },
    });
  }

  async findOne(id: string) {
    const run = await this.prismaService.reportRun.findUnique({
      where: { id },
      include: {
        reportTemplate: { select: { name: true, outputFormat: true } },
      },
    });
    if (!run) {
      throw new NotFoundException('Report run not found');
    }
    return run;
  }

  async getDownloadableFile(
    id: string,
  ): Promise<{ filePath: string; fileName: string }> {
    const run = await this.findOne(id);
    if (run.status !== 'SUCCESS') {
      throw new BadRequestException(
        `Cannot download — this run has status ${run.status}, not SUCCESS`,
      );
    }
    if (!run.filePath || !fs.existsSync(run?.filePath)) {
      throw new NotFoundException('Report file no longer exists on disk');
    }
    const fileName = run.filePath.split(/[\\/]/).pop() || 'report';
    return { filePath: run.filePath, fileName };
  }
}
