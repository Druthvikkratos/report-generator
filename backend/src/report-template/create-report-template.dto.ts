enum ReportType {
  ORDERS_SUMMARY = 'ORDERS_SUMMARY',
}

enum ScheduleFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

enum OutputFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
}

import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateReportTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(ReportType, {
    message: `role must be one of the following values: ${Object.values(ReportType).join(', ')}`,
  })
  @IsNotEmpty()
  reportType: ReportType;

  @IsEnum(ScheduleFrequency, {
    message: `schedule frequency must be one of the following values: ${Object.values(ScheduleFrequency).join(', ')}`,
  })
  @IsNotEmpty()
  scheduleFrequency: ScheduleFrequency;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'specific time to run must be strictly in HH:mm format',
  })
  specificTimeToRun: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsEnum(OutputFormat, {
    message: `outout format must be one of the following values: ${Object.values(OutputFormat).join(', ')}`,
  })
  @IsNotEmpty()
  outputFormat: OutputFormat;

 @IsOptional()
 @IsBoolean()
  isActive: boolean;
}
