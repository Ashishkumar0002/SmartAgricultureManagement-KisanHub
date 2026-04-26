import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';

import { ExpertQueriesComponent } from '../expert-queries.component';
import { ExpertAlertsComponent } from '../expert-alerts.component';
import { ExpertTechniquesComponent } from '../expert-techniques.component';
import { ExpertProfileComponent } from '../expert-profile.component';

@Component({
  selector: 'app-expert-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    ExpertQueriesComponent,
    ExpertAlertsComponent,
    ExpertTechniquesComponent,
    ExpertProfileComponent,
  ],
  template: `
    <section class="bg-dashboard expert-shell">
      <section class="expert-layout">
        <mat-tab-group>
          <mat-tab label="Queries">
            <app-expert-queries></app-expert-queries>
          </mat-tab>
          <mat-tab label="Alerts">
            <app-expert-alerts></app-expert-alerts>
          </mat-tab>
          <mat-tab label="Techniques">
            <app-expert-techniques></app-expert-techniques>
          </mat-tab>
          <mat-tab label="Profile">
            <app-expert-profile></app-expert-profile>
          </mat-tab>
        </mat-tab-group>
      </section>
    </section>
  `,
  styleUrl: './expert-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpertDashboard {}
