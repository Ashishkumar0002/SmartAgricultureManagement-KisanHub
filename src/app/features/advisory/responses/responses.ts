import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';

import { AdvisoryService } from '../../../core/services/advisory.service';
import { AuthService } from '../../../core/services/auth.service';
import { ExpertService } from '../../../core/services/expert.service';
import { Advisory, AdvisoryMessage } from '../../../shared/models/advisory.model';

type AdvisoryWithHistory = Advisory & {
  expertMessages: AdvisoryMessage[];
};

@Component({
  selector: 'app-responses',
  imports: [DatePipe, MatCardModule],
  templateUrl: './responses.html',
  styleUrl: './responses.scss',
})
export class Responses {
  protected advisories: AdvisoryWithHistory[] = [];

  constructor(
    private readonly advisoryService: AdvisoryService,
    private readonly expertService: ExpertService,
    private readonly authService: AuthService
  ) {
    this.loadAdvisoriesWithHistory();
  }

  private loadAdvisoriesWithHistory(): void {
    const role = this.authService.userRole();

    if (role === 'expert') {
      this.expertService.getAssignedQueries('answered').pipe(
        switchMap((queries) => {
          const baseAdvisories: Advisory[] = queries.map((item) => ({
            id: item.id,
            question: item.question,
            response: item.response ?? undefined,
            farmer_id: item.farmer_id ?? undefined,
            expert_id: item.expert_id ?? undefined,
            created_at: item.created_at ? String(item.created_at) : undefined,
          }));

          return this.attachHistory(baseAdvisories, (advisoryId) =>
            this.expertService.getQueryMessages(advisoryId).pipe(
              map((messages) => messages.map((message): AdvisoryMessage => ({
                ...message,
                created_at: message.created_at ? String(message.created_at) : undefined,
              })))
            )
          );
        }),
        catchError(() => of([] as AdvisoryWithHistory[]))
      ).subscribe((items) => {
        this.advisories = items;
      });
      return;
    }

    this.advisoryService.getFarmerAdvisories().pipe(
      switchMap((items) => this.attachHistory(items, (advisoryId) => this.advisoryService.getAdvisoryMessages(advisoryId))),
      catchError(() => of([] as AdvisoryWithHistory[]))
    ).subscribe((items) => {
      this.advisories = items;
    });
  }

  private attachHistory(
    advisories: Advisory[],
    getMessages: (advisoryId: number) => Observable<AdvisoryMessage[]>
  ) {
    if (advisories.length === 0) {
      return of([] as AdvisoryWithHistory[]);
    }

    return forkJoin(
      advisories.map((advisory) =>
        getMessages(advisory.id).pipe(
          map((messages: AdvisoryMessage[]) => {
            const expertMessages = messages
              .filter((message: AdvisoryMessage) => message.is_from_expert)
              .map((message: AdvisoryMessage) => ({
                ...message,
                created_at: message.created_at ? String(message.created_at) : undefined,
              }));

            return {
              ...advisory,
              expertMessages,
            };
          }),
          catchError(() =>
            of({
              ...advisory,
              expertMessages: [],
            })
          )
        )
      )
    );
  }
}
