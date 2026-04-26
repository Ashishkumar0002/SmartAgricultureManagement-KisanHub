import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AdvisoryService } from '../../../core/services/advisory.service';

@Component({
  selector: 'app-ask-expert',
  imports: [
    ReactiveFormsModule,
    NgIf,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
  templateUrl: './ask-expert.html',
  styleUrl: './ask-expert.scss',
})
export class AskExpert {
  private readonly fb = new FormBuilder();
  protected readonly form = this.fb.nonNullable.group({
    question: ['', [Validators.required, Validators.minLength(10)]],
    farmer_id: [undefined as number | undefined],
  });

  constructor(
    private readonly advisoryService: AdvisoryService,
    private readonly snackBar: MatSnackBar
  ) {}

  protected submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      question: this.form.controls.question.value.trim(),
      farmer_id: this.form.controls.farmer_id.value ?? undefined,
    };

    console.log('[AskExpert] Submitting farmer query', {
      endpoint: '/advisory',
      payload,
    });

    this.advisoryService.askExpert(payload).subscribe({
      next: (created) => {
        console.log('[AskExpert] Query created successfully', created);
        this.snackBar.open('Query submitted to experts', 'Close', { duration: 2400 });
        this.form.reset({ question: '', farmer_id: undefined });
      },
      error: (error) => {
        console.error('[AskExpert] Query submission failed', {
          payload,
          status: error?.status,
          detail: error?.error,
        });
        this.snackBar.open(error?.error?.detail || 'Unable to submit query', 'Close', { duration: 2800 });
      },
    });
  }
}
