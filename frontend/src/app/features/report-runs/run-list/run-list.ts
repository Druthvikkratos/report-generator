import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ReportRunService } from '../../../core/services/report-run-service';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  catchError,
  from,
  interval,
  mergeMap,
  of,
  retry,
  scan,
  startWith,
  switchMap,
  tap,
  toArray,
} from 'rxjs';
import { ReportRun } from '../../../core/models/report-run.model';
import { HttpClient } from '@angular/common/http';

const POLL_INTERVAL_MS = 5000;

@Component({
  selector: 'app-run-list',
  imports: [DatePipe],
  templateUrl: './run-list.html',
  styleUrl: './run-list.scss',
})
export class RunList {
  private reportRunService = inject(ReportRunService);
  private http = inject(HttpClient);

  isRefreshing = signal(false);

  selectedIds = signal<Set<string>>(new Set());
  isDownloading = signal<boolean>(false);
  downloadProgress = signal<{ done: number; total: number; failed?: number } | null>(null);

  runs = toSignal(
    interval(POLL_INTERVAL_MS).pipe(
      startWith(0),
      tap(() => this.isRefreshing.set(true)),
      switchMap(() =>
        this.reportRunService.poll().pipe(
          retry({
            count: 2,
            delay: 1000,
          }),
          tap(() => this.isRefreshing.set(false)),
          catchError((err) => {
            console.error('Polling failed after retries', err);
            this.isRefreshing.set(false);
            return of(null);
          }),
        ),
      ),
      scan(
        (previousRuns: ReportRun[], currentRuns: ReportRun[] | null) => currentRuns ?? previousRuns,
        [],
      ),
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

  toggleSelection(id: string): void {
    const current = new Set(this.selectedIds());
    current.has(id) ? current.delete(id) : current.add(id);
    this.selectedIds.set(current);
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  get selectedDownloadableCount(): number {
    const selected = this.selectedIds();
    return this.runs().filter((r) => selected.has(r.id) && r.status === 'SUCCESS').length;
  }

  bulkDownloadSelected(): void {
    const downloadbleIds = this.runs()
      .filter((r) => this.selectedIds().has(r.id) && r.status === 'SUCCESS')
      .map((r) => r.id);
    if (downloadbleIds.length === 0) return;
    this.isDownloading.set(true);
    this.downloadProgress.set({ done: 0, total: downloadbleIds.length });

    from(downloadbleIds)
      .pipe(
        mergeMap(
          (id) =>
            this.http.get(this.downloadUrl(id), { responseType: 'blob' }).pipe(
              retry({ count: 1, delay: 500 }),
              catchError((err) => {
                console.error(`Download failed permanently for run ${id}`, err);
                return of(null);
              }),
              tap((blob) => {
                if (blob) {
                  this.triggerBrowserDownload(blob, id);
                }
                const progress = this.downloadProgress();
                if (progress) {
                  this.downloadProgress.set({ done: progress.done + 1, total: progress.total });
                }
              }),
            ),
          3,
        ),
        toArray(),
      )
      .subscribe({
        next: (results) => {
          const failedCount = results.filter((r) => r === null).length;
          this.isDownloading.set(false);
          this.downloadProgress.set(null);
          this.selectedIds.set(new Set());
          if (failedCount > 0) {
          alert(`${failedCount} of ${downloadbleIds.length} downloads failed. Please retry those individually.`);
        }
        },
        error: (err: any) => {
          this.isDownloading.set(false);
          this.downloadProgress.set(null);
          console.error('Bulk download failed partway through', err);
        },
      });
  }

  private triggerBrowserDownload(blob: Blob, runId: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${runId}`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
