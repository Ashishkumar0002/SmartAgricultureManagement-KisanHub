import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { catchError, of } from 'rxjs';

import { FarmerService, Advisory, AdvisoryDetail, AdvisoryMessage } from '../../core/services/farmer.service';

interface AIChatBubble {
  role: 'user' | 'assistant';
  content: string;
}

@Component({
  selector: 'app-ask-expert',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatChipsModule,
    MatListModule,
    MatSelectModule,
  ],
  template: `
    <section class="ask-expert">
      <h2>Ask an Expert</h2>

      <!-- Submit Query Section -->
      <mat-card class="query-card">
        <mat-card-header>
          <mat-card-title>Submit Your Question</mat-card-title>
          <mat-card-subtitle>Ask experts for farming advice</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="queryForm" (ngSubmit)="submitQuery()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Your Question</mat-label>
              <textarea
                matInput
                formControlName="question"
                rows="5"
                placeholder="Describe your farming issue or ask for advice..."
              ></textarea>
              <mat-hint *ngIf="queryForm.get('question')?.errors?.['minlength']">
                Minimum 10 characters required
              </mat-hint>
            </mat-form-field>

            <div class="form-actions">
              <button
                mat-raised-button
                color="primary"
                type="submit"
                [disabled]="!queryForm.valid || isSubmitting()"
              >
                <mat-icon>send</mat-icon>
                {{ isSubmitting() ? 'Submitting...' : 'Submit Question' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- AI Chatbot Section -->
      <mat-card class="query-card">
        <mat-card-header>
          <mat-card-title>AI Farming Assistant</mat-card-title>
          <mat-card-subtitle>Get instant practical farming guidance</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="ai-chat-history">
            @if (aiMessages().length === 0) {
              <p class="no-data">Start the chat by asking any farming question.</p>
            } @else {
              @for (item of aiMessages(); track $index) {
                <div [class]="'message ' + (item.role === 'assistant' ? 'expert' : 'farmer')">
                  <div class="message-header">{{ item.role === 'assistant' ? 'AI Expert' : 'You' }}</div>
                  <div class="message-body">{{ item.content }}</div>
                </div>
              }
            }
          </div>

          <div class="message-input-container">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Ask AI</mat-label>
              <textarea
                matInput
                [ngModel]="aiMessageInput()"
                (ngModelChange)="aiMessageInput.set($event)"
                rows="3"
                placeholder="e.g., Why are my tomato leaves curling?"
              ></textarea>
            </mat-form-field>

            <button
              mat-raised-button
              color="primary"
              type="button"
              (click)="sendAIMessage()"
              [disabled]="!aiMessageInput().trim() || isSendingAIMessage()"
            >
              <mat-icon>smart_toy</mat-icon>
              {{ isSendingAIMessage() ? 'Thinking...' : 'Send to AI' }}
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Queries List -->
      <mat-card class="queries-list-card">
        <mat-card-header>
          <mat-card-title>Your Questions</mat-card-title>
          <mat-card-subtitle>Track your queries and expert responses</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="filter-row">
            <mat-form-field appearance="outline">
              <mat-label>Filter by Status</mat-label>
              <mat-select [(ngModel)]="selectedStatus" (ngModelChange)="filterQueries()">
                <mat-option value="">All</mat-option>
                <mat-option value="pending">Pending</mat-option>
                <mat-option value="assigned">Assigned</mat-option>
                <mat-option value="answered">Answered</mat-option>
              </mat-select>
            </mat-form-field>
            <button mat-raised-button (click)="loadQueries()">
              <mat-icon>refresh</mat-icon>
              Refresh
            </button>
          </div>

          @if (isLoadingQueries()) {
            <div class="loading">Loading queries...</div>
          } @else if (filteredQueries().length > 0) {
            <mat-nav-list class="queries-list">
              @for (query of filteredQueries(); track query.id) {
                <mat-list-item 
                  class="query-item"
                  [class.pending]="query.status === 'pending'"
                  [class.assigned]="query.status === 'assigned'"
                  [class.answered]="query.status === 'answered'"
                  (click)="selectQuery(query.id)"
                >
                  <mat-icon matListItemIcon [class]="'status-' + query.status">
                    {{ getStatusIcon(query.status) }}
                  </mat-icon>
                  <div matListItemTitle>{{ query.question.substring(0, 60) }}...</div>
                  <div matListItemLine>{{ getFormattedDate(query.created_at) }}</div>
                  <mat-chip [class]="'status-chip ' + query.status">
                    {{ query.status | uppercase }}
                  </mat-chip>
                </mat-list-item>
              }
            </mat-nav-list>
          } @else {
            <p class="no-data">No questions yet. Submit one above!</p>
          }
        </mat-card-content>
      </mat-card>

      <!-- Chat View -->
      @if (selectedQuery()) {
        <mat-card class="chat-card">
          <mat-card-header>
            <mat-card-title>Question Details</mat-card-title>
            <mat-card-subtitle>
              <mat-chip [class]="'status-chip ' + selectedQuery()!.status">
                {{ selectedQuery()!.status | uppercase }}
              </mat-chip>
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="question-text">
              <strong>Your Question:</strong>
              <p>{{ selectedQuery()!.question }}</p>
            </div>

            @if (selectedQuery()!.response) {
              <div class="expert-response">
                <strong>Expert Response:</strong>
                <p>{{ selectedQuery()!.response }}</p>
              </div>
            }

            <!-- Chat Messages -->
            @if (chatMessages().length > 0) {
              <div class="messages-container">
                <h4>Chat History</h4>
                @for (message of chatMessages(); track message.id) {
                  <div [class]="'message ' + (message.is_from_expert ? 'expert' : 'farmer')">
                    <div class="message-header">
                      {{ message.is_from_expert ? 'Expert' : 'You' }}
                    </div>
                    <div class="message-body">{{ message.message }}</div>
                    <div class="message-time">{{ getFormattedDate(message.created_at) }}</div>
                  </div>
                }
              </div>
            }

            <!-- Send Message -->
            <div class="message-input-container">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Send a message</mat-label>
                <textarea
                  matInput
                  [(ngModel)]="newMessage"
                  rows="3"
                  placeholder="Type your message..."
                ></textarea>
              </mat-form-field>
              <button
                mat-raised-button
                color="primary"
                (click)="sendMessage()"
                [disabled]="!newMessage().trim() || isSendingMessage()"
              >
                <mat-icon>send</mat-icon>
                Send
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </section>
  `,
  styles: [`
    .ask-expert {
      padding: 24px;
    }

    h2 {
      color: #2e7d32;
      margin-bottom: 24px;
    }

    .query-card, .queries-list-card, .chat-card {
      background: white;
      margin-bottom: 24px;
    }

    .full-width {
      width: 100%;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 16px;
    }

    .filter-row {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      align-items: flex-end;
    }

    .queries-list {
      padding: 0;

      .query-item {
        margin: 8px 0;
        border-radius: 4px;
        border-left: 4px solid #ccc;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: #f5f5f5;
        }

        &.pending {
          border-left-color: #ff9800;
        }

        &.assigned {
          border-left-color: #2196f3;
        }

        &.answered {
          border-left-color: #4caf50;
        }
      }
    }

    .status-chip {
      font-size: 11px !important;

      &.pending {
        background: #fff3e0;
        color: #ff9800;
      }

      &.assigned {
        background: #e3f2fd;
        color: #2196f3;
      }

      &.answered {
        background: #e8f5e9;
        color: #4caf50;
      }
    }

    .question-text, .expert-response {
      padding: 16px;
      background: #f5f5f5;
      border-radius: 4px;
      margin-bottom: 16px;

      strong {
        display: block;
        margin-bottom: 8px;
        color: #333;
      }

      p {
        margin: 0;
        color: #666;
        line-height: 1.6;
      }
    }

    .expert-response {
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
    }

    .messages-container {
      margin: 24px 0;
      padding: 16px 0;
      border-top: 1px solid #e0e0e0;

      h4 {
        margin-top: 0;
        color: #666;
      }

      .message {
        margin-bottom: 16px;
        padding: 12px;
        border-radius: 8px;
        max-width: 70%;

        &.farmer {
          margin-left: auto;
          background: #e3f2fd;
          border-bottom-right-radius: 0;
        }

        &.expert {
          background: #e8f5e9;
          border-bottom-left-radius: 0;
        }

        .message-header {
          font-size: 12px;
          font-weight: 600;
          color: #666;
          margin-bottom: 4px;
        }

        .message-body {
          color: #333;
          line-height: 1.5;
        }

        .message-time {
          font-size: 11px;
          color: #999;
          margin-top: 4px;
        }
      }
    }

    .ai-chat-history {
      max-height: 320px;
      overflow-y: auto;
      padding: 6px 0 4px;
      margin-bottom: 12px;
      border-top: 1px solid #e0e0e0;
    }

    .message-input-container {
      display: flex;
      gap: 12px;
      margin-top: 20px;
      border-top: 1px solid #e0e0e0;
      padding-top: 16px;

      button {
        align-self: flex-end;
      }
    }

    .no-data {
      color: #999;
      text-align: center;
      padding: 24px;
      font-style: italic;
    }

    .loading {
      color: #999;
      padding: 24px;
      text-align: center;
    }

    @media (max-width: 768px) {
      .ask-expert {
        padding: 16px;
      }

      .filter-row {
        flex-direction: column;
        align-items: stretch;
      }

      .message-input-container {
        flex-direction: column;
      }

      .messages-container .message {
        max-width: 90%;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AskExpertComponent {
  protected farmerService = inject(FarmerService);
  protected snackBar = inject(MatSnackBar);
  protected fb = inject(FormBuilder);

  protected queryForm = this.fb.group({
    question: ['', [Validators.required, Validators.minLength(10)]],
  });

  protected queries = signal<Advisory[]>([]);
  protected filteredQueries = signal<Advisory[]>([]);
  protected selectedQuery = signal<AdvisoryDetail | null>(null);
  protected chatMessages = signal<AdvisoryMessage[]>([]);
  protected newMessage = signal('');
  protected selectedStatus = signal('');
  protected isSubmitting = signal(false);
  protected isLoadingQueries = signal(false);
  protected isSendingMessage = signal(false);
  protected aiMessages = signal<AIChatBubble[]>([]);
  protected aiMessageInput = signal('');
  protected isSendingAIMessage = signal(false);

  constructor() {
    this.loadQueries();
  }

  protected loadQueries(): void {
    this.isLoadingQueries.set(true);
    console.log('[FarmerAskExpert] Loading farmer queries', {
      endpoint: '/farmer/advisory',
      status: this.selectedStatus() || 'all',
    });
    this.farmerService.getFarmerAdvisory()
      .pipe(
        catchError((error) => {
          console.error('[FarmerAskExpert] Failed to load farmer queries', {
            statusCode: error?.status,
            detail: error?.error,
          });
          this.isLoadingQueries.set(false);
          return of([]);
        })
      )
      .subscribe(queries => {
        console.log('[FarmerAskExpert] Farmer queries loaded', { count: queries.length });
        this.queries.set(queries);
        this.filterQueries();
        this.isLoadingQueries.set(false);
      });
  }

  protected filterQueries(): void {
    const status = this.selectedStatus();
    const all = this.queries();
    this.filteredQueries.set(status ? all.filter(q => q.status === status) : all);
  }

  protected selectQuery(queryId: number): void {
    this.farmerService.getAdvisoryDetail(queryId)
      .pipe(
        catchError(() => {
          this.snackBar.open('Failed to load query details', 'Close', { duration: 3000 });
          return of(null);
        })
      )
      .subscribe(detail => {
        if (detail) {
          this.selectedQuery.set(detail);
          this.chatMessages.set(detail.messages);
        }
      });
  }

  protected submitQuery(): void {
    if (!this.queryForm.valid) return;

    this.isSubmitting.set(true);
    const question = (this.queryForm.get('question')?.value || '').trim();

    console.log('[FarmerAskExpert] Submitting query', {
      endpoint: '/farmer/advisory',
      payload: { question },
    });

    this.farmerService.submitAdvisory(question)
      .pipe(
        catchError((error) => {
          console.error('[FarmerAskExpert] Query submission failed', {
            statusCode: error?.status,
            detail: error?.error,
            payload: { question },
          });
          this.snackBar.open(error?.error?.detail || 'Failed to submit question', 'Close', { duration: 3000 });
          this.isSubmitting.set(false);
          return of(null);
        })
      )
      .subscribe(query => {
        if (query) {
          console.log('[FarmerAskExpert] Query submitted successfully', query);
          this.queryForm.reset();
          this.snackBar.open('Question submitted successfully!', 'Close', { duration: 2000 });
          this.loadQueries();
        }
        this.isSubmitting.set(false);
      });
  }

  protected sendMessage(): void {
    if (!this.newMessage().trim() || !this.selectedQuery()) return;

    this.isSendingMessage.set(true);
    const message = this.newMessage().trim();

    this.farmerService.sendAdvisoryMessage(this.selectedQuery()!.id, message)
      .pipe(
        catchError(() => {
          this.snackBar.open('Failed to send message', 'Close', { duration: 3000 });
          this.isSendingMessage.set(false);
          return of(null);
        })
      )
      .subscribe(newMsg => {
        if (newMsg) {
          this.chatMessages.update(msgs => [...msgs, newMsg]);
          this.newMessage.set('');
          this.snackBar.open('Message sent!', 'Close', { duration: 1500 });
        }
        this.isSendingMessage.set(false);
      });
  }

  protected sendAIMessage(): void {
    const message = this.aiMessageInput().trim();
    if (!message) return;

    const nextHistory = [...this.aiMessages(), { role: 'user' as const, content: message }];
    this.aiMessages.set(nextHistory);
    this.aiMessageInput.set('');
    this.isSendingAIMessage.set(true);

    const historyPayload = nextHistory.slice(-10).map((item) => ({ role: item.role, content: item.content }));

    this.farmerService
      .chatWithAI({
        message,
        history: historyPayload,
        language: 'en',
      })
      .pipe(
        catchError((error) => {
          const detail =
            typeof error?.error?.detail === 'string'
              ? error.error.detail
              : 'AI assistant is temporarily unavailable right now.';

          this.aiMessages.update((items) => [
            ...items,
            {
              role: 'assistant',
              content:
                'I am unable to respond right now. Please try again in a moment. You can still submit your query to a human expert.',
            },
          ]);
          this.snackBar.open(detail, 'Close', { duration: 3500 });
          this.isSendingAIMessage.set(false);
          return of(null);
        })
      )
      .subscribe((response) => {
        if (response?.reply) {
          this.aiMessages.update((items) => [...items, { role: 'assistant', content: response.reply }]);
        }
        this.isSendingAIMessage.set(false);
      });
  }

  protected getStatusIcon(status: string): string {
    switch (status) {
      case 'pending':
        return 'schedule';
      case 'assigned':
        return 'assignment';
      case 'answered':
        return 'check_circle';
      default:
        return 'help';
    }
  }

  protected getFormattedDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
