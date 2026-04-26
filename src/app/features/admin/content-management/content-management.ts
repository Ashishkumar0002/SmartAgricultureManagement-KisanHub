import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { catchError, of } from 'rxjs';

import { AdminService, Content } from '../../../core/services/admin.service';

@Component({
  selector: 'app-content-management',
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCardModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './content-management.html',
  styleUrl: './content-management.scss',
})
export class ContentManagement {
  private readonly adminService = inject(AdminService);
  protected fb = inject(FormBuilder);

  protected displayedColumns = ['id', 'title', 'category', 'location', 'createdAt', 'actions'];
  protected contents = signal<Content[]>([]);
  protected filteredContents = signal<Content[]>([]);
  protected selectedCategory = signal<string>('all');
  protected showForm = signal(false);
  protected pageSize = 10;
  protected pageIndex = 0;
  protected totalContents = 0;

  protected contentForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    category: ['weather', Validators.required],
    location: [''],
    metadata: [''],
  });

  constructor() {
    this.loadContents();
  }

  private loadContents() {
    this.adminService.getContents()
      .pipe(
        catchError(() => {
          console.error('Failed to load contents');
          return of([]);
        })
      )
      .subscribe(contents => {
        this.contents.set(contents);
        this.filterContents();
      });
  }

  protected filterContents() {
    let filtered = this.contents();

    if (this.selectedCategory() !== 'all') {
      filtered = filtered.filter(c => c.category === this.selectedCategory());
    }

    this.totalContents = filtered.length;
    const startIdx = this.pageIndex * this.pageSize;
    this.filteredContents.set(filtered.slice(startIdx, startIdx + this.pageSize));
  }

  protected onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.filterContents();
  }

  protected onCategoryChange() {
    this.pageIndex = 0;
    this.filterContents();
  }

  protected submitForm() {
    if (this.contentForm.valid) {
      const formValue = this.contentForm.value;
      this.adminService.createContent({
        title: formValue.title || '',
        description: formValue.description || '',
        category: formValue.category || 'weather',
        location: formValue.location || undefined,
        metadata: formValue.metadata || undefined,
      })
        .pipe(
          catchError(() => {
            alert('Failed to create content');
            return of(null);
          })
        )
        .subscribe(result => {
          if (result) {
            this.contentForm.reset({ category: 'weather' });
            this.showForm.set(false);
            this.loadContents();
          }
        });
    }
  }

  protected deleteContent(contentId: number) {
    if (confirm('Are you sure you want to delete this content?')) {
      this.adminService.deleteContent(contentId)
        .pipe(
          catchError(() => {
            alert('Failed to delete content');
            return of(null);
          })
        )
        .subscribe(() => {
          this.loadContents();
        });
    }
  }

  protected getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      weather: '#ff9800',
      market: '#4caf50',
      technique: '#2196f3',
      disease_prevention: '#f44336',
    };
    return colors[category] || '#9e9e9e';
  }
}
