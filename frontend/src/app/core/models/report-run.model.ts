export type RunStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface ReportRun{
    id: string;
    status: RunStatus;
    filePath: string | null;
    errorMessage: string | null
    runStarted: string
    runEnded: string
    reportTemplateId: string
    reportTemplate?: {name: string; outputFormat: string}
}