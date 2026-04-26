import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { catchError, of } from 'rxjs';

import { FarmerService, Equipment, EquipmentBooking } from '../../core/services/farmer.service';

@Component({
  selector: 'app-equipment-rental',
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
    MatGridListModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatTabsModule,
    MatSelectModule,
  ],
  template: `
    <section class="equipment-section">
      <h2>Equipment Rental System</h2>

      <mat-tab-group>
        <!-- Browse Equipment Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>construction</mat-icon>
            <span>Browse Equipment</span>
          </ng-template>

          <div class="equipment-browse">
            <div class="filter-row">
              <mat-form-field appearance="outline">
                <mat-label>Search Location</mat-label>
                <input matInput [(ngModel)]="searchLocation" placeholder="Enter location" />
              </mat-form-field>
              <button mat-raised-button color="primary" (click)="loadAvailableEquipment()">
                <mat-icon>search</mat-icon>
                Search
              </button>
            </div>

            <div class="equipment-grid">
              @if (isLoadingEquipment()) {
                <div class="loading">Loading equipment...</div>
              } @else if (availableEquipment().length > 0) {
                @for (item of availableEquipment(); track item.id) {
                  <mat-card class="equipment-card">
                    <mat-card-header>
                      <mat-card-title>{{ item.name }}</mat-card-title>
                      <mat-card-subtitle>{{ item.location }}</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <p class="description">{{ item.description }}</p>
                      <div class="details-grid">
                        <div class="detail">
                          <span class="label">Daily Rent</span>
                          <span class="value">₹{{ item.daily_rent }}</span>
                        </div>
                        <div class="detail">
                          <span class="label">Condition</span>
                          <span class="condition-badge" [class.good]="item.condition === 'good'"
                                [class.fair]="item.condition === 'fair'"
                                [class.repair]="item.condition === 'repair_needed'">
                            {{ item.condition | titlecase }}
                          </span>
                        </div>
                        <div class="detail">
                          <span class="label">Availability</span>
                          <span class="avail-badge" [class.available]="item.is_available"
                                [class.unavailable]="!item.is_available">
                            {{ item.is_available ? 'Available' : 'Rented' }}
                          </span>
                        </div>
                      </div>
                    </mat-card-content>
                    <mat-card-actions>
                      <button
                        mat-raised-button
                        color="accent"
                        (click)="selectEquipmentToBook(item)"
                        [disabled]="!item.is_available"
                      >
                        <mat-icon>shopping_cart</mat-icon>
                        Book Now
                      </button>
                    </mat-card-actions>
                  </mat-card>
                }
              } @else {
                <p class="no-data">No equipment available. Try searching in a different location.</p>
              }
            </div>
          </div>
        </mat-tab>

        <!-- My Listings Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>list</mat-icon>
            <span>My Listings</span>
          </ng-template>

          <div class="my-listings">
            <div class="add-equipment-btn">
              <button mat-raised-button color="primary" (click)="toggleAddForm()">
                <mat-icon>add</mat-icon>
                Add Equipment
              </button>
            </div>

            @if (showAddForm()) {
              <mat-card class="add-form-card">
                <mat-card-header>
                  <mat-card-title>Add Equipment for Rent</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <form [formGroup]="equipmentForm" (ngSubmit)="addEquipment()">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Equipment Name</mat-label>
                      <input matInput formControlName="name" />
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Description</mat-label>
                      <textarea matInput formControlName="description" rows="3"></textarea>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Daily Rent (₹)</mat-label>
                      <input matInput type="number" formControlName="daily_rent" />
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Location</mat-label>
                      <input matInput formControlName="location" />
                    </mat-form-field>

                    <div class="form-actions">
                      <button mat-raised-button color="primary" type="submit" [disabled]="!equipmentForm.valid">
                        <mat-icon>add_circle</mat-icon>
                        Add
                      </button>
                      <button mat-raised-button (click)="toggleAddForm($event)" type="button">
                        Cancel
                      </button>
                    </div>
                  </form>
                </mat-card-content>
              </mat-card>
            }

            <div class="listings-grid">
              @if (myEquipment().length > 0) {
                @for (item of myEquipment(); track item.id) {
                  <mat-card class="equipment-card">
                    <mat-card-header>
                      <mat-card-title>{{ item.name }}</mat-card-title>
                      <mat-card-subtitle>{{ item.location }}</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <p>{{ item.description }}</p>
                      <div class="status-grid">
                        <span class="status-badge listed">Listed</span>
                      </div>
                    </mat-card-content>
                    <mat-card-actions>
                      <button mat-icon-button (click)="deleteEquipment(item.id)" color="warn">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </mat-card-actions>
                  </mat-card>
                }
              } @else {
                <p class="no-data">No equipment listed yet.</p>
              }
            </div>
          </div>
        </mat-tab>

        <!-- My Bookings Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>calendar_today</mat-icon>
            <span>My Bookings</span>
          </ng-template>

          <div class="my-bookings">
            @if (myBookings().length > 0) {
              <table mat-table [dataSource]="myBookings()" class="bookings-table">
                <!-- Equipment Column -->
                <ng-container matColumnDef="equipment_id">
                  <th mat-header-cell *matHeaderCellDef>Equipment</th>
                  <td mat-cell *matCellDef="let element">{{ element.equipment_id }}</td>
                </ng-container>

                <!-- Dates Column -->
                <ng-container matColumnDef="dates">
                  <th mat-header-cell *matHeaderCellDef>Date Range</th>
                  <td mat-cell *matCellDef="let element">
                    {{ formatDate(element.start_date) }} to {{ formatDate(element.end_date) }}
                  </td>
                </ng-container>

                <!-- Cost Column -->
                <ng-container matColumnDef="total_cost">
                  <th mat-header-cell *matHeaderCellDef>Cost</th>
                  <td mat-cell *matCellDef="let element">₹{{ element.total_cost }}</td>
                </ng-container>

                <!-- Status Column -->
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let element">
                    <span class="booking-status" [class]="getBookingStatusClass(element.status)">
                      {{ getBookingStatusLabel(element.status) }}
                    </span>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="bookingColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: bookingColumns"></tr>
              </table>
            } @else {
              <p class="no-data">No bookings yet. Search available equipment above!</p>
            }
          </div>
        </mat-tab>
      </mat-tab-group>

      <!-- Booking Modal -->
      @if (selectedForBooking()) {
        <mat-card class="booking-modal">
          <mat-card-header>
            <mat-card-title>Book Equipment</mat-card-title>
            <button mat-icon-button (click)="selectedForBooking.set(null)" class="close-btn">
              <mat-icon>close</mat-icon>
            </button>
          </mat-card-header>

          <mat-card-content>
            <h3>{{ selectedForBooking()!.name }}</h3>
            <p class="price">₹{{ selectedForBooking()!.daily_rent }} per day</p>

            <form [formGroup]="bookingForm" (ngSubmit)="submitBooking()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Start Date</mat-label>
                <input matInput [matDatepicker]="startPicker" formControlName="start_date" />
                <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>End Date</mat-label>
                <input matInput [matDatepicker]="endPicker" formControlName="end_date" />
                <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
              </mat-form-field>

              <div class="total-cost">
                <strong>Estimated Total Cost:</strong>
                <span>₹{{ calculateCost(selectedForBooking()!.daily_rent) }}</span>
              </div>

              <div class="form-actions">
                <button mat-raised-button color="primary" type="submit" [disabled]="!bookingForm.valid">
                  <mat-icon>check</mat-icon>
                  Confirm Booking
                </button>
                <button mat-raised-button (click)="selectedForBooking.set(null)" type="button">
                  Cancel
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }
    </section>
  `,
  styles: [`
    .equipment-section {
      padding: 24px;
    }

    h2 {
      color: #2e7d32;
      margin-bottom: 24px;
    }

    .filter-row {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      align-items: flex-end;
    }

    .equipment-grid, .listings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .equipment-card {
      background: white;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
      }

      .description {
        color: #666;
        font-size: 14px;
      }

      .details-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin: 16px 0;
      }

      .detail {
        display: flex;
        flex-direction: column;

        .label {
          font-size: 12px;
          color: #999;
          margin-bottom: 4px;
        }

        .value {
          font-weight: 600;
          color: #333;
        }

        .condition-badge, .avail-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;

          &.good {
            background: #e8f5e9;
            color: #4caf50;
          }

          &.fair {
            background: #fff3e0;
            color: #ff9800;
          }

          &.repair {
            background: #ffebee;
            color: #f44336;
          }

          &.available {
            background: #e8f5e9;
            color: #4caf50;
          }

          &.unavailable {
            background: #f5f5f5;
            color: #999;
          }
        }
      }
    }

    .add-equipment-btn {
      margin-bottom: 24px;
    }

    .add-form-card {
      background: white;
      margin-bottom: 24px;

      .full-width {
        width: 100%;
        margin-bottom: 16px;
      }

      .form-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
    }

    .bookings-table {
      width: 100%;
      background: white;

      th {
        background: #f5f5f5;
        font-weight: 600;
        padding: 12px;
      }

      td {
        padding: 12px;
        border-bottom: 1px solid #e0e0e0;
      }

      .booking-status {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;

        &.booked,
        &.confirmed,
        &.pending {
          background: #fff3e0;
          color: #ff9800;
        }

        &.approved {
          background: #e8f5e9;
          color: #4caf50;
        }

        &.completed {
          background: #e3f2fd;
          color: #2196f3;
        }

        &.rejected {
          background: #ffebee;
          color: #f44336;
        }
      }
    }

    .booking-modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90%;
      max-width: 500px;
      background: white;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
      z-index: 1000;

      .close-btn {
        position: absolute;
        right: 8px;
        top: 8px;
      }

      h3 {
        margin-top: 0;
        color: #2e7d32;
      }

      .price {
        font-size: 18px;
        font-weight: 600;
        color: #ff9800;
        margin: 8px 0 16px;
      }

      .full-width {
        width: 100%;
        margin-bottom: 16px;
      }

      .total-cost {
        padding: 12px;
        background: #f5f5f5;
        border-radius: 4px;
        display: flex;
        justify-content: space-between;
        margin: 16px 0;

        span {
          font-weight: 600;
          color: #2e7d32;
        }
      }

      .form-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
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
      .equipment-section {
        padding: 16px;
      }

      .equipment-grid, .listings-grid {
        grid-template-columns: 1fr;
      }

      .filter-row {
        flex-direction: column;
        align-items: stretch;
      }

      .booking-modal {
        width: 95%;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentRentalComponent {
  protected farmerService = inject(FarmerService);
  protected snackBar = inject(MatSnackBar);
  protected fb = inject(FormBuilder);

  protected availableEquipment = signal<Equipment[]>([]);
  protected myEquipment = signal<Equipment[]>([]);
  protected myBookings = signal<EquipmentBooking[]>([]);
  protected searchLocation = '';
  protected isLoadingEquipment = signal(false);
  protected showAddForm = signal(false);
  protected selectedForBooking = signal<Equipment | null>(null);
  protected bookingColumns = ['equipment_id', 'dates', 'total_cost', 'status'];

  protected equipmentForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required]],
    daily_rent: [0, [Validators.required, Validators.min(1)]],
    location: ['', [Validators.required]],
  });

  protected bookingForm = this.fb.group({
    start_date: ['', Validators.required],
    end_date: ['', Validators.required],
  });

  constructor() {
    this.loadAvailableEquipment();
    this.loadMyEquipment();
    this.loadMyBookings();
  }

  protected loadAvailableEquipment(): void {
    this.isLoadingEquipment.set(true);
    const location = this.searchLocation.trim() || undefined;

    this.farmerService.getAvailableEquipment(location)
      .pipe(
        catchError(() => {
          this.isLoadingEquipment.set(false);
          return of([]);
        })
      )
      .subscribe(equipment => {
        this.availableEquipment.set(equipment);
        this.isLoadingEquipment.set(false);
      });
  }

  protected loadMyEquipment(): void {
    this.farmerService.getMyEquipmentListings()
      .pipe(catchError(() => of([])))
      .subscribe(equipment => this.myEquipment.set(equipment));
  }

  protected loadMyBookings(): void {
    this.farmerService.getMyEquipmentBookings()
      .pipe(catchError(() => of([])))
      .subscribe(bookings => this.myBookings.set(bookings));
  }

  protected toggleAddForm(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    this.showAddForm.update(v => !v);
  }

  protected addEquipment(): void {
    if (!this.equipmentForm.valid) return;

    const formValue = this.equipmentForm.value;
    this.farmerService.addEquipmentForRent(formValue as Partial<Equipment>)
      .pipe(
        catchError(() => {
          this.snackBar.open('Failed to add equipment', 'Close', { duration: 3000 });
          return of(null);
        })
      )
      .subscribe(equipment => {
        if (equipment) {
          this.equipmentForm.reset();
          this.showAddForm.set(false);
          this.snackBar.open('Equipment added successfully!', 'Close', { duration: 2000 });
          this.loadMyEquipment();
        }
      });
  }

  protected deleteEquipment(equipmentId: number): void {
    if (confirm('Delete this equipment listing?')) {
      this.farmerService.deleteEquipment(equipmentId)
        .pipe(
          catchError(() => {
            this.snackBar.open('Failed to delete equipment', 'Close', { duration: 3000 });
            return of(null);
          })
        )
        .subscribe(() => {
          this.snackBar.open('Equipment deleted!', 'Close', { duration: 2000 });
          this.loadMyEquipment();
        });
    }
  }

  protected selectEquipmentToBook(equipment: Equipment): void {
    this.selectedForBooking.set(equipment);
    this.bookingForm.reset();
  }

  protected calculateCost(dailyRate: number): number {
    const start = this.bookingForm.get('start_date')?.value;
    const end = this.bookingForm.get('end_date')?.value;

    if (!start || !end) return 0;

    const startDate = new Date(start);
    const endDate = new Date(end);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    return days * dailyRate;
  }

  protected submitBooking(): void {
    if (!this.bookingForm.valid || !this.selectedForBooking()) return;

    const startValue = this.bookingForm.get('start_date')?.value;
    const endValue = this.bookingForm.get('end_date')?.value;
    if (!startValue || !endValue) return;

    const start = new Date(startValue);
    const end = new Date(endValue);

    this.farmerService.bookEquipment(this.selectedForBooking()!.id, start, end)
      .pipe(
        catchError(() => {
          this.snackBar.open('Failed to book equipment', 'Close', { duration: 3000 });
          return of(null);
        })
      )
      .subscribe(booking => {
        if (booking) {
          this.selectedForBooking.set(null);
          this.snackBar.open('Equipment booked successfully!', 'Close', { duration: 2000 });
          this.loadMyBookings();
          this.loadAvailableEquipment();
        }
      });
  }

  protected formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  protected getBookingStatusClass(status: string): string {
    const normalizedStatus = (status || '').toLowerCase();
    if (normalizedStatus === 'confirmed' || normalizedStatus === 'pending' || normalizedStatus === 'approved') {
      return 'booked';
    }
    if (normalizedStatus === 'completed') {
      return 'completed';
    }
    if (normalizedStatus === 'rejected' || normalizedStatus === 'cancelled') {
      return 'rejected';
    }
    return 'booked';
  }

  protected getBookingStatusLabel(status: string): string {
    const normalizedStatus = (status || '').toLowerCase();
    if (normalizedStatus === 'completed') {
      return 'Completed';
    }
    if (normalizedStatus === 'rejected' || normalizedStatus === 'cancelled') {
      return 'Cancelled';
    }
    return 'Booked';
  }
}
