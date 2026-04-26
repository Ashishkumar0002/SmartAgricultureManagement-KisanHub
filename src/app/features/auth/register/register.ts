import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';

import { FarmerRegister } from '../farmer-register/farmer-register';
import { ExpertRegister } from '../expert-register/expert-register';

@Component({
  selector: 'app-register',
  imports: [
    MatCardModule,
    MatTabsModule,
    MatIconModule,
    FarmerRegister,
    ExpertRegister,
  ],
  template: `
    <mat-card class="auth-card page-card chooser-card">
      <div class="register-header">
        <mat-icon>how_to_reg</mat-icon>
        <div>
          <h2>Create Your KisanHub Account</h2>
          <p>Select your role and complete the form.</p>
        </div>
      </div>

      <mat-tab-group>
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>agriculture</mat-icon>
            <span>Farmer</span>
          </ng-template>
          <div class="tab-body">
            <app-farmer-register></app-farmer-register>
          </div>
        </mat-tab>

        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>science</mat-icon>
            <span>Expert</span>
          </ng-template>
          <div class="tab-body">
            <app-expert-register></app-expert-register>
          </div>
        </mat-tab>
      </mat-tab-group>
    </mat-card>
  `,
  styles: [`
    .auth-card {
      width: min(100%, 1100px);
      padding: 18px;
      border-radius: 20px;
    }

    .register-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;

      mat-icon {
        color: #2e7d32;
        font-size: 32px;
        width: 32px;
        height: 32px;
      }

      h2 {
        margin: 0;
      }

      p {
        margin: 4px 0 0;
        color: var(--sams-muted);
      }
    }

    .tab-body {
      padding-top: 12px;
    }
  `],
})
export class Register {
}
