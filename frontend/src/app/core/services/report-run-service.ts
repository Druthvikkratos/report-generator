import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../envirorments/environment';
import { Observable } from 'rxjs';
import { ReportRun } from '../models/report-run.model';
import { RunStats } from '../models/dashboard-stats.model';

@Injectable({
  providedIn: 'root',
})
export class ReportRunService {
  private http = inject(HttpClient)
  private baseUrl = `${environment.apiUrl}/report-runs`;

  poll(): Observable<ReportRun[]>{
    return this.http.get<ReportRun[]>(this.baseUrl)
  }

  getDownloadUrl(runId: string): string{
    return `${this.baseUrl}/${runId}/download`
  }

  getStats(): Observable<RunStats>{
    return this.http.get<RunStats>(`${this.baseUrl}/stats/summary`)
  }
}
