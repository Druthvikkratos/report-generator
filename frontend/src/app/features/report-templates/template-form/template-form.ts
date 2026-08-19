import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReportTemplateService } from '../../../core/services/report-template';
import {
  OutputFormat,
  ReportTemplate,
  ReportType,
  ScheduleFrequency,
} from '../../../core/models/report-template.model';

@Component({
  selector: 'app-template-form',
  imports: [ReactiveFormsModule],
  templateUrl: './template-form.html',
  styleUrl: './template-form.scss',
})
export class TemplateForm {
  private fb = inject(FormBuilder);
  private reportTemplateService = inject(ReportTemplateService);

  editingTemplate = input<ReportTemplate | null>(null);
  saved = output<void>();
  cancelled = output<void>();

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control<string>(''),
    reportType: this.fb.nonNullable.control<ReportType>('ORDERS_SUMMARY'),
    scheduleFrequency: this.fb.nonNullable.control<ScheduleFrequency>('DAILY'),
    specificTimeToRun: this.fb.nonNullable.control<string>('06:00', [
      Validators.required,
      Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
    ]),
    dayOfWeek: this.fb.nonNullable.control<number>(1),
    outputFormat: this.fb.nonNullable.control<OutputFormat>('PDF'),
  });

  constructor() {
    effect(() => {
      const template = this.editingTemplate();
      if (template) {
        this.form.patchValue({
          name: template.name,
          reportType: template.reportType,
          scheduleFrequency: template.scheduleFrequency,
          specificTimeToRun: template.specificTimeToRun,
          dayOfWeek: template.dayOfWeek ?? 1,
          outputFormat: template.outputFormat,
        });
      } else {
        this.form.reset({
          name: '',
          reportType: 'ORDERS_SUMMARY',
          scheduleFrequency: 'DAILY',
          specificTimeToRun: '06:00',
          dayOfWeek: 1,
          outputFormat: 'PDF',
        });
      }
    });
  }

  get showDaysOfWeek(): boolean {
    return this.form.controls.scheduleFrequency.value === 'WEEKLY';
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const value = this.form.getRawValue();
      const payload = {
        ...value,
        dayOfWeek: value.scheduleFrequency === 'WEEKLY' ? value.dayOfWeek : undefined,
      };
      const template = this.editingTemplate();
      if (template) {
        await this.reportTemplateService.update(template.id, payload);
      } else {
        await this.reportTemplateService.create(payload);
      }
      this.saved.emit();
    } catch (error: any) {
      this.errorMessage.set(error.error.message || 'Something went wrong');
    } finally {
      this.loading.set(false);
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
