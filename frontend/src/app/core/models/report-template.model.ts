export type ReportType = 'ORDERS_SUMMARY';
export type ScheduleFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type OutputFormat = 'PDF' | 'EXCEL';

export interface ReportTemplate {
  id: string;
  name: string;
  reportType: ReportType;
  scheduleFrequency: ScheduleFrequency;
  specificTimeToRun: string;
  dayOfWeek: number | null;
  outputFormat: OutputFormat;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportTemplateRequest {
  name: string;
  reportType: ReportType;
  scheduleFrequency: ScheduleFrequency;
  specificTimeToRun: string;
  dayOfWeek?: number;
  outputFormat: OutputFormat;
}

export type UpdateReportTemplateRequest = Partial<CreateReportTemplateRequest>;