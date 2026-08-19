import { Component, inject, Inject, signal } from '@angular/core';
import { TemplateForm } from '../template-form/template-form';
import { ReportTemplateService } from '../../../core/services/report-template';
import { ReportTemplate } from '../../../core/models/report-template.model';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  debounceTime,
  distinctUntilChanged,
  startWith,
  switchMap,
  tap,
  from,
  concatMap,
  toArray,
} from 'rxjs';

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
        return this.reportTemplateService
          .searchTemplates(query)
          .pipe(tap(() => this.searchLoading.set(false)));
      }),
    ),
    { initialValue: [] as ReportTemplate[] },
  );
  loading = signal(false);
  showForm = signal(false);
  editingTemplate = signal<ReportTemplate | null>(null);

  selectedIds = signal<Set<string>>(new Set());
  bulkToggling = signal(false);
  bulkProgress = signal<{ done: number; total: number } | null>(null);

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

  toggleSelection(id: string): void {
    const current = new Set(this.selectedIds());
    console.log('BEFORE - current set:', Array.from(current), 'has this id?', current.has(id));
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    console.log('AFTER - current set:', Array.from(current));
    this.selectedIds.set(current);
    console.log('selectedIds size is now:', this.selectedIds().size);
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  refreshList(): void {
    this.searchControl.setValue(this.searchControl.value);
  }

  bulkToggleSelected(): void {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    this.bulkToggling.set(true);
    this.bulkProgress.set({ done: 0, total: ids.length });

    from(ids).pipe(
      concatMap((id) =>
        this.reportTemplateService.toggleStatusObservable(id).pipe(
          tap(() => {
            const progress = this.bulkProgress();
            if (progress) {
              this.bulkProgress.set({ done: progress.done + 1, total: progress.total });
            }
          }),
        ),
      ),
      toArray(),
    ).subscribe({
      next: () => {
        this.bulkToggling.set(false)
        this.bulkProgress.set(null)
        this.selectedIds.set(new Set())
        this.refreshList()
      },
      error :(err) => {
        this.bulkToggling.set(false)
        this.bulkProgress.set(null)
        console.error('Bulk toggle failed partway through', err)
        this.refreshList()
      }
    })
  }
}
