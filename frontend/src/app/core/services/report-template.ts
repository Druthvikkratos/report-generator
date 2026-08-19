import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../envirorments/environment';
import { firstValueFrom, Observable } from 'rxjs';
import {
  CreateReportTemplateRequest,
  ReportTemplate,
  UpdateReportTemplateRequest,
} from '../models/report-template.model';

@Injectable({
  providedIn: 'root',
})
export class ReportTemplateService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/report-templates`;

  async findAll(): Promise<ReportTemplate[]> {
    return firstValueFrom(this.http.get<ReportTemplate[]>(this.baseUrl));
  }

  async findOne(id: string): Promise<ReportTemplate> {
    return firstValueFrom(this.http.get<ReportTemplate>(`${this.baseUrl}/${id}`));
  }

  async create(payload: CreateReportTemplateRequest) {
    return firstValueFrom(
      this.http.post<{ message: string; reportTemplate: ReportTemplate }>(this.baseUrl, payload),
    );
  }

  async update(id: string, payload: UpdateReportTemplateRequest) {
    return firstValueFrom(
      this.http.put<{ message: string; reportTemplate: ReportTemplate }>(
        `${this.baseUrl}/${id}`,
        payload,
      ),
    );
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.baseUrl}/${id}`));
  }

  async toggleStatus(id: string) {
    return firstValueFrom(
      this.http.put<{ message: string; reportTemplate: ReportTemplate }>(
        `${this.baseUrl}/${id}/toggle-status`,
        {},
      ),
    );
  }

  searchTemplates(query: string): Observable<ReportTemplate[]> {
    const params = query ? `?search=${encodeURIComponent(query)}` : '';
    return this.http.get<ReportTemplate[]>(`${this.baseUrl}${params}`);
  }
}
