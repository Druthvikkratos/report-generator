import { Component, inject, Inject, signal } from '@angular/core';
import { TemplateForm } from '../template-form/template-form';
import { ReportTemplateService } from '../../../core/services/report-template';
import { ReportTemplate } from '../../../core/models/report-template.model';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, startWith, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-template-list',
  imports: [TemplateForm, ReactiveFormsModule],
  templateUrl: './template-list.html',
  styleUrl: './template-list.scss',
})
export class TemplateList {
  private reportTemplateService = inject(ReportTemplateService);

  searchControl = new FormControl('', { nonNullable: true });
  searchLoading = signal(false);

  templates = toSignal(
    this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((query) => {
        this.searchLoading.set(true);
        return this.reportTemplateService.searchTemplates(query).pipe(
          tap(() => this.searchLoading.set(false))
        );
      }),
    ),
    { initialValue: [] as ReportTemplate[] },
  );
  loading = signal(false);
  showForm = signal(false);
  editingTemplate = signal<ReportTemplate | null>(null);

  async ngOnInit(): Promise<void> {
    // await this.loadTemplates();
  }

  // async loadTemplates() {
  //   this.loading.set(true);
  //   try {
  //     this.templates.set(await this.reportTemplateService.findAll());
  //   } catch (error) {
  //   } finally {
  //     this.loading.set(false);
  //   }
  // }

  onCreateNew(): void {
    this.editingTemplate.set(null);
    this.showForm.set(true);
  }

  onEdit(template: ReportTemplate): void {
    this.editingTemplate.set(template);
    this.showForm.set(true);
  }

  async onToggleStatus(template: ReportTemplate): Promise<void> {
    await this.reportTemplateService.toggleStatus(template.id);
    this.searchControl.setValue(this.searchControl.value);
  }

  async onDelete(template: ReportTemplate): Promise<void> {
    if (!confirm(`Delete "${template.name}"? This cannot be undone.`)) return;
    await this.reportTemplateService.remove(template.id);
    this.searchControl.setValue(this.searchControl.value);
  }

  async onFormSaved(): Promise<void> {
    this.showForm.set(false);
    this.searchControl.setValue(this.searchControl.value);
  }

  onFormCancelled(): void {
    this.showForm.set(false);
  }
}
