import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ReportRunService } from '../../../core/services/report-run-service';
import { toSignal } from '@angular/core/rxjs-interop';
import { interval, startWith, switchMap, tap } from 'rxjs';
import { ReportRun } from '../../../core/models/report-run.model';

const POLL_INTERVAL_MS = 5000;

@Component({
  selector: 'app-run-list',
  imports: [DatePipe],
  templateUrl: './run-list.html',
  styleUrl: './run-list.scss',
})
export class RunList {
  private reportRunService = inject(ReportRunService);

  isRefreshing = signal(false);

  runs = toSignal(
    interval(POLL_INTERVAL_MS).pipe(
      startWith(0),
      tap(() => this.isRefreshing.set(true)),
      switchMap(() => this.reportRunService.poll().pipe(tap(() => this.isRefreshing.set(false)))),
    ),
    { initialValue: [] as ReportRun[] },
  );

  downloadUrl(runId: string): string {
    return this.reportRunService.getDownloadUrl(runId);
  }

  statusClass(status: string): string {
    switch (status) {
      case 'SUCCESS':
        return 'status-matched';
      case 'FAILED':
        return 'status-unmatched';
      default:
        return 'status-discrepancy';
    }
  }
}
