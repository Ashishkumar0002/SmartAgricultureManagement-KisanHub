import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { catchError, interval, of, timeout } from 'rxjs';

import { ExpertService, ExpertQuery, ExpertQueryDetail, AdvisoryMessage } from '../../core/services/expert.service';

@Component({
  selector: 'app-expert-queries',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatChipsModule,
    MatListModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="queries-container">
      <div class="queries-header">
        <h2>Farmer Query Management</h2>
        <p>Handle and respond to farmer queries efficiently</p>
      </div>

      <div class="queries-layout">
        <!-- Left: Query List -->
        <div class="queries-list-section">
          <div class="filter-section">
            <mat-form-field appearance="outline" class="status-filter">
              <mat-label>Filter by Status</mat-label>
              <mat-select [ngModel]="selectedStatus()" (ngModelChange)="onStatusChange($event)">
                <mat-option value="">All Queries</mat-option>
                <mat-option value="assigned">Assigned (Pending)</mat-option>
                <mat-option value="answered">Answered</mat-option>
                <mat-option value="pending">Unassigned Pending</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          @if (isLoadingQueries()) {
            <div class="loading-spinner">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
          } @else if (queries().length === 0) {
            <div class="empty-state">
              <mat-icon>inbox</mat-icon>
              <p>No queries found</p>
            </div>
          } @else {
            <div class="queries-list">
              @for (query of queries(); track query.id) {
                <div
                  class="query-item"
                  [class.active]="selectedQuery()?.id === query.id"
                  (click)="selectQuery(query.id)"
                >
                  <div class="query-header">
                    <div class="query-badge">{{ query.id }}</div>
                    <div class="query-farmer-name">{{ query.farmer_name || 'Unknown Farmer' }}</div>
                    <div class="query-status-chip" [ngClass]="'status-' + query.status">
                      {{ query.status }}
                    </div>
                  </div>
                  <div class="query-preview">
                    <strong>Query:</strong> {{ query.question | slice:0:80 }}{{ query.question.length > 80 ? '...' : '' }}
                  </div>
                  <div class="query-meta">
                    <span class="meta-item">
                      <mat-icon>schedule</mat-icon>
                      {{ query.created_at | date:'short' }}
                    </span>
                    <span class="meta-item">
                      <mat-icon>location_on</mat-icon>
                      {{ query.farmer_location }}
                    </span>
                    <span class="meta-item">
                      <mat-icon>grass</mat-icon>
                      {{ query.farmer_crop_variety || 'N/A' }}
                    </span>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Right: Chat Window -->
        <div class="chat-section">
          @if (selectedQuery()) {
            <mat-card class="chat-card">
              <mat-card-header>
                <div class="chat-header-info">
                  <h3>{{ selectedQuery()!.farmer_name }}</h3>
                  <div class="farmer-details">
                    <span><mat-icon>location_on</mat-icon> {{ selectedQuery()!.farmer_location }}</span>
                    <span><mat-icon>grass</mat-icon> {{ selectedQuery()!.farmer_crop_variety }}</span>
                    <span><mat-icon>terrain</mat-icon> {{ selectedQuery()!.farmer_soil_type }}</span>
                  </div>
                </div>
                <div class="status-badge" [ngClass]="'status-' + selectedQuery()!.status">
                  {{ selectedQuery()!.status }}
                </div>
              </mat-card-header>

              <mat-divider></mat-divider>

              <!-- Query Details -->
              <mat-card-content class="query-details">
                <div class="detail-section">
                  <h4>Original Query</h4>
                  <p class="query-text">{{ selectedQuery()!.question }}</p>

                  @if (selectedQuery()!.images && selectedQuery()!.images.length > 0) {
                    <div class="images-section">
                      <h5>Attached Images</h5>
                      <div class="images-grid">
                        @for (image of selectedQuery()!.images; track image.id) {
                          <div class="image-item">
                            <img [src]="image.image_path" [alt]="'Query image ' + image.id">
                            <p class="image-date">{{ image.uploaded_at | date:'short' }}</p>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>

                <!-- Chat Messages -->
                <mat-divider></mat-divider>
                <div class="messages-section">
                  <h4>Chat History</h4>
                  <div class="messages-list">
                    @if (selectedQuery()!.messages && selectedQuery()!.messages.length > 0) {
                      @for (message of selectedQuery()!.messages; track message.id) {
                        <div class="message" [class.expert-message]="message.is_from_expert">
                          <div class="message-header">
                            <span class="sender-name">
                              {{ message.is_from_expert ? 'You' : 'Farmer' }}
                            </span>
                            <span class="message-time">{{ message.created_at | date:'short' }}</span>
                          </div>
                          <p class="message-text">{{ message.message }}</p>
                        </div>
                      }
                    } @else {
                      <p class="no-messages">No messages yet</p>
                    }
                  </div>
                </div>
              </mat-card-content>

              <mat-divider></mat-divider>

              <!-- Message Input & Status Update -->
              <mat-card-content class="action-section">
                <div class="status-update">
                  <mat-form-field appearance="outline">
                    <mat-label>Update Status</mat-label>
                    <mat-select [(ngModel)]="updateStatus">
                      <mat-option value="assigned">In Progress</mat-option>
                      <mat-option value="answered">Resolved</mat-option>
                    </mat-select>
                  </mat-form-field>
                  <button mat-raised-button color="primary" (click)="updateQueryStatus()">
                    <mat-icon>save</mat-icon>
                    Update Status
                  </button>
                </div>

                <mat-divider></mat-divider>

                <div class="message-input-section">
                  <h4>Send Response</h4>

                  <div class="ai-tools">
                    <button
                      mat-stroked-button
                      color="primary"
                      (click)="generateAiResponse()"
                      [disabled]="isGeneratingAiResponse() || isSendingMessage()"
                    >
                      <mat-icon>auto_awesome</mat-icon>
                      <span>{{ isGeneratingAiResponse() ? 'Generating...' : 'Generate AI Response' }}</span>
                    </button>

                    <button
                      mat-button
                      color="primary"
                      (click)="regenerateAiResponse()"
                      [disabled]="!aiResponseGenerated() || isGeneratingAiResponse() || isSendingMessage()"
                    >
                      <mat-icon>refresh</mat-icon>
                      Regenerate
                    </button>

                    <button
                      mat-button
                      color="primary"
                      (click)="focusResponseEditor()"
                      [disabled]="!aiResponseGenerated()"
                    >
                      <mat-icon>edit</mat-icon>
                      Edit
                    </button>
                  </div>

                  @if (aiGenerationError()) {
                    <p class="ai-error">{{ aiGenerationError() }}</p>
                  }

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>{{ aiResponseGenerated() ? 'AI Suggested Response (Editable)' : 'Your Message' }}</mat-label>
                    <textarea
                      #responseTextarea
                      matInput
                      [ngModel]="messageText()"
                      (ngModelChange)="messageText.set($event)"
                      placeholder="Type your response..."
                      rows="4"
                      maxlength="500"
                    ></textarea>
                    <mat-hint align="end">{{ messageText().length }}/500</mat-hint>
                  </mat-form-field>

                  <div class="message-buttons">
                    <button
                      mat-raised-button
                      color="accent"
                      (click)="sendMessage()"
                      [disabled]="!messageText().trim() || isSendingMessage()"
                    >
                      <mat-icon>send</mat-icon>
                      <span>{{ isSendingMessage() ? 'Sending...' : 'Send Message' }}</span>
                    </button>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          } @else {
            <div class="empty-chat">
              <mat-icon>chat_bubble_outline</mat-icon>
              <p>Select a query to view details and respond</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .queries-container {
      max-width: 1600px;
      margin: 0 auto;
    }

    .queries-header {
      margin-bottom: 24px;

      h2 {
        font-size: 24px;
        font-weight: 700;
        margin: 0 0 8px 0;
      }

      p {
        font-size: 14px;
        color: #666;
        margin: 0;
      }
    }

    .queries-layout {
      display: grid;
      grid-template-columns: 350px 1fr;
      gap: 20px;
      min-height: 600px;
    }

    .queries-list-section {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
    }

    .filter-section {
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;

      .status-filter {
        width: 100%;
      }
    }

    .queries-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-thumb {
        background: #ccc;
        border-radius: 3px;
      }
    }

    .query-item {
      padding: 12px;
      margin-bottom: 8px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background-color: #f9f9f9;
        border-color: #2E7D32;
      }

      &.active {
        background-color: #e8f5e9;
        border-color: #2E7D32;
        box-shadow: 0 2px 6px rgba(46, 125, 50, 0.2);
      }
    }

    .query-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .query-badge {
      background: #2E7D32;
      color: white;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      min-width: 24px;
      text-align: center;
    }

    .query-farmer-name {
      flex: 1;
      font-weight: 600;
      font-size: 14px;
      color: #1a1a1a;
    }

    .query-status-chip {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;

      &.status-assigned {
        background: #BBDEFB;
        color: #1565C0;
      }

      &.status-answered {
        background: #C8E6C9;
        color: #2E7D32;
      }

      &.status-pending {
        background: #FFE0B2;
        color: #E65100;
      }
    }

    .query-preview {
      font-size: 13px;
      color: #666;
      line-height: 1.4;
      margin-bottom: 8px;
    }

    .query-meta {
      display: flex;
      gap: 12px;
      font-size: 12px;
      color: #999;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      color: #999;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        opacity: 0.5;
        margin-bottom: 12px;
      }

      p {
        margin: 0;
        font-size: 14px;
      }
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      align-items: center;
      flex: 1;
    }

    .chat-section {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .chat-card {
      border: none;
      box-shadow: none;
      border-radius: 0;
      height: 100%;
      display: flex;
      flex-direction: column;

      mat-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 16px;
        border-bottom: 1px solid #e0e0e0;
      }

      mat-card-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;

        &::-webkit-scrollbar {
          width: 6px;
        }

        &::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 3px;
        }
      }
    }

    .chat-header-info {
      h3 {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
      }

      .farmer-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 13px;
        color: #666;

        span {
          display: flex;
          align-items: center;
          gap: 6px;

          mat-icon {
            font-size: 14px;
            width: 14px;
            height: 14px;
          }
        }
      }
    }

    .status-badge {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;

      &.status-assigned {
        background: #BBDEFB;
        color: #1565C0;
      }

      &.status-answered {
        background: #C8E6C9;
        color: #2E7D32;
      }

      &.status-pending {
        background: #FFE0B2;
        color: #E65100;
      }
    }

    .query-details {
      padding: 16px 0;
    }

    .detail-section {
      margin-bottom: 16px;

      h4 {
        font-size: 14px;
        font-weight: 600;
        margin: 0 0 8px 0;
        color: #1a1a1a;
      }

      .query-text {
        font-size: 14px;
        line-height: 1.6;
        color: #333;
        margin: 0;
      }
    }

    .images-section {
      margin-top: 12px;

      h5 {
        font-size: 13px;
        font-weight: 600;
        margin: 0 0 8px 0;
      }

      .images-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }

      .image-item {
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        overflow: hidden;

        img {
          width: 100%;
          height: 80px;
          object-fit: cover;
        }

        .image-date {
          padding: 4px 8px;
          font-size: 11px;
          color: #999;
          margin: 0;
          background: #f5f5f5;
          text-align: center;
        }
      }
    }

    .messages-section {
      margin: 16px 0;

      h4 {
        font-size: 14px;
        font-weight: 600;
        margin: 0 0 12px 0;
      }
    }

    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 300px;
      overflow-y: auto;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-thumb {
        background: #ccc;
        border-radius: 3px;
      }
    }

    .message {
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      background: #fafafa;

      &.expert-message {
        background: #e8f5e9;
        border-color: #2E7D32;
      }
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;

      .sender-name {
        font-weight: 600;
        font-size: 13px;
        color: #1a1a1a;
      }

      .message-time {
        font-size: 11px;
        color: #999;
      }
    }

    .message-text {
      font-size: 13px;
      line-height: 1.5;
      color: #333;
      margin: 0;
    }

    .no-messages {
      text-align: center;
      color: #999;
      font-size: 13px;
      margin: 20px 0;
    }

    .action-section {
      padding: 16px;
      border-top: 1px solid #e0e0e0;
    }

    .status-update {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;

      mat-form-field {
        flex: 1;
      }

      button {
        min-width: 120px;
      }
    }

    .message-input-section {
      h4 {
        font-size: 14px;
        font-weight: 600;
        margin: 0 0 12px 0;
      }

      .ai-tools {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-bottom: 10px;
        flex-wrap: wrap;
      }

      .ai-error {
        margin: 0 0 10px 0;
        font-size: 12px;
        color: #c62828;
      }

      .full-width {
        width: 100%;
      }

      .message-buttons {
        display: flex;
        gap: 12px;
        margin-top: 12px;

        button {
          flex: 1;
          min-width: 120px;
        }
      }
    }

    .empty-chat {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      color: #999;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        opacity: 0.3;
        margin-bottom: 16px;
      }

      p {
        margin: 0;
        font-size: 14px;
      }
    }

    @media (max-width: 1024px) {
      .queries-layout {
        grid-template-columns: 1fr;
      }

      .chat-section {
        max-height: 500px;
      }
    }

    @media (max-width: 768px) {
      .queries-layout {
        gap: 16px;
      }

      .queries-list-section {
        max-height: 300px;
      }

      .chat-section {
        max-height: 400px;
      }

      .chat-header-info .farmer-details {
        flex-direction: row;
        flex-wrap: wrap;
        gap: 12px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpertQueriesComponent {
  private expertService = inject(ExpertService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private regenerateDebounceHandle: ReturnType<typeof setTimeout> | null = null;

  @ViewChild('responseTextarea') private responseTextarea?: ElementRef<HTMLTextAreaElement>;

  protected queries = signal<ExpertQuery[]>([]);
  protected selectedQuery = signal<ExpertQueryDetail | null>(null);
  protected selectedStatus = signal<string>('');
  protected messageText = signal<string>('');
  protected updateStatus = signal<string>('assigned');

  protected isLoadingQueries = signal(false);
  protected isSendingMessage = signal(false);
  protected isGeneratingAiResponse = signal(false);
  protected aiResponseGenerated = signal(false);
  protected aiGenerationError = signal<string | null>(null);

  constructor() {
    this.loadQueries();
    this.startAutoRefresh();
    this.destroyRef.onDestroy(() => {
      if (this.regenerateDebounceHandle) {
        clearTimeout(this.regenerateDebounceHandle);
      }
    });
  }

  private loadQueries(silentError: boolean = false): void {
    this.isLoadingQueries.set(true);
    const status = this.selectedStatus() || undefined;

    console.log('[ExpertQueries] Loading queries', {
      endpoint: '/expert/queries',
      status_filter: status ?? 'all',
    });

    this.expertService.getAssignedQueries(status)
      .pipe(
        catchError(error => {
          console.error('[ExpertQueries] Failed to load queries', {
            status_filter: status ?? 'all',
            statusCode: error?.status,
            detail: error?.error,
          });
          if (!silentError) {
            this.snackBar.open('Error loading queries', 'Close', { duration: 3000 });
          }
          return of([]);
        })
      )
      .subscribe(queries => {
        console.log('[ExpertQueries] Loaded queries', { count: queries.length });
        this.queries.set(queries);
        this.isLoadingQueries.set(false);
      });
  }

  private startAutoRefresh(): void {
    interval(15000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.isSendingMessage() || this.isLoadingQueries()) {
          return;
        }

        this.loadQueries(true);

        const currentQuery = this.selectedQuery();
        if (currentQuery) {
          this.selectQuery(currentQuery.id);
        }
      });
  }

  protected onStatusChange(status: string): void {
    this.selectedStatus.set(status);
    this.loadQueries();
  }

  protected selectQuery(queryId: number): void {
    this.expertService.getQueryDetail(queryId)
      .pipe(
        catchError(error => {
          this.snackBar.open('Error loading query details', 'Close', { duration: 3000 });
          return of(null);
        })
      )
      .subscribe(detail => {
        if (detail) {
          this.selectedQuery.set(detail);
          this.updateStatus.set(detail.status);
          this.aiGenerationError.set(null);
          this.aiResponseGenerated.set(false);
          if (!this.isGeneratingAiResponse()) {
            this.messageText.set('');
          }
        }
      });
  }

  protected generateAiResponse(): void {
    this.requestAiResponse(false);
  }

  protected regenerateAiResponse(): void {
    if (this.regenerateDebounceHandle) {
      clearTimeout(this.regenerateDebounceHandle);
    }

    // Debounce repeated clicks to avoid unnecessary provider calls.
    this.regenerateDebounceHandle = setTimeout(() => {
      this.requestAiResponse(true);
    }, 450);
  }

  protected focusResponseEditor(): void {
    if (!this.aiResponseGenerated()) {
      return;
    }

    const textarea = this.responseTextarea?.nativeElement;
    if (!textarea) {
      return;
    }

    textarea.focus();
    const endPosition = textarea.value.length;
    textarea.setSelectionRange(endPosition, endPosition);
  }

  private requestAiResponse(regenerate: boolean): void {
    const detail = this.selectedQuery();
    if (!detail) {
      return;
    }

    const query = (detail.question || '').trim();
    if (!query) {
      this.snackBar.open('Cannot generate AI response for an empty query.', 'Close', { duration: 3000 });
      return;
    }

    if (this.isGeneratingAiResponse() || this.isSendingMessage()) {
      return;
    }

    this.aiGenerationError.set(null);
    this.isGeneratingAiResponse.set(true);

    this.expertService.generateAiResponse({
      query,
      crop: detail.farmer_crop_variety || undefined,
      soil: detail.farmer_soil_type || undefined,
      location: detail.farmer_location || undefined,
      regenerate,
    })
      .pipe(
        timeout(20000),
        catchError(error => {
          const errorMessage = error?.status === 504
            ? 'AI generation timed out. Please try again.'
            : (error?.error?.detail || 'Failed to generate AI response.');

          this.aiGenerationError.set(errorMessage);
          this.snackBar.open(errorMessage, 'Close', { duration: 3500 });
          return of(null);
        })
      )
      .subscribe(result => {
        if (result?.success && result.aiResponse?.trim()) {
          this.messageText.set(result.aiResponse.trim());
          this.aiResponseGenerated.set(true);
          this.snackBar.open('AI response generated. You can edit it before sending.', 'Close', { duration: 2500 });
          setTimeout(() => this.focusResponseEditor());
        }

        this.isGeneratingAiResponse.set(false);
      });
  }

  protected sendMessage(): void {
    if (!this.selectedQuery() || !this.messageText().trim()) {
      return;
    }

    this.isSendingMessage.set(true);

    this.expertService.sendMessageToQuery(this.selectedQuery()!.id, this.messageText())
      .pipe(
        catchError(error => {
          this.snackBar.open('Error sending message', 'Close', { duration: 3000 });
          return of(null);
        })
      )
      .subscribe(message => {
        if (message) {
          this.messageText.set('');
          this.snackBar.open('Message sent successfully', 'Close', { duration: 2000 });
          // Reload query detail to show new message
          this.selectQuery(this.selectedQuery()!.id);
        }
        this.isSendingMessage.set(false);
      });
  }

  protected updateQueryStatus(): void {
    if (!this.selectedQuery()) {
      return;
    }

    this.expertService.updateQueryStatus(this.selectedQuery()!.id, this.updateStatus())
      .pipe(
        catchError(error => {
          this.snackBar.open('Error updating status', 'Close', { duration: 3000 });
          return of(null);
        })
      )
      .subscribe(updatedQuery => {
        if (updatedQuery) {
          this.snackBar.open('Status updated successfully', 'Close', { duration: 2000 });
          this.loadQueries();
          this.selectQuery(this.selectedQuery()!.id);
        }
      });
  }
}
