import { Component, inject, signal } from '@angular/core';
import { ReportTemplate } from '../../../core/models/report-template.model';
import { ReportRun } from '../../../core/models/report-run.model';
import { RunStats } from '../../../core/models/dashboard-stats.model';
import { ReportTemplateService } from '../../../core/services/report-template';
import { ReportRunService } from '../../../core/services/report-run-service';
import { catchError, combineLatest, forkJoin, interval, map, of, startWith, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

const POLL_INTERVAL_MS = 10000;

interface DashboardData {
  templates: ReportTemplate[];
  runs: ReportRun[];
  stats: RunStats;
}

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private templateService = inject(ReportTemplateService);
  private runService = inject(ReportRunService);

  loading = signal(true);

  private initialLoad$ = forkJoin({
    templates: this.templateService.searchTemplates(''),
    runs: this.runService.poll(),
  }).pipe(
    catchError((err) => {
      console.error('Initial dashboard load failed', err);
      return of({ templates: [] as ReportTemplate[], runs: [] as ReportRun[] });
    }),
  );

  private liveData$ = combineLatest({
    runs: interval(POLL_INTERVAL_MS).pipe(
      startWith(0),
      switchMap(() => this.runService.poll()),
      catchError(() => of([] as ReportRun[])),
    ),
    stats: interval(POLL_INTERVAL_MS).pipe(
      startWith(0),
      switchMap(() => this.runService.getStats()),
      catchError(() => of({ total: 0, success: 0, failed: 0, pending: 0 } as RunStats)),
    ),
  });

  templates = toSignal(
    this.initialLoad$.pipe(
      map((data) => {
        this.loading.set(false);
        return data.templates;
      }),
    ),
    { initialValue: [] as ReportTemplate[] },
  );

  liveData = toSignal(this.liveData$, {
    initialValue: {
      runs: [] as ReportRun[],
      stats: { total: 0, success: 0, failed: 0, pending: 0 },
    },
  });

  get recentRuns(): ReportRun[]{
    return this.liveData().runs.slice(0, 5)
  }

  get stats(): RunStats{
    return this.liveData().stats
  }

  get activeTemplateCount(): number {
    return this.templates().filter((t) => t.isActive).length
  }
}
