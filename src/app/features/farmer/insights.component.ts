import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { catchError, of } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AIInsightsResponse, FarmerService, MarketPrice, Weather } from '../../core/services/farmer.service';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  template: `
    <section class="insights-section">
      <h2>Insights & Analytics</h2>

      <!-- Weather Section -->
      <div class="insights-row">
        <mat-card class="weather-card">
          <mat-card-header>
            <mat-card-title>Weather Forecast</mat-card-title>
            <mat-card-subtitle>Location-based weather data</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="weather-input">
              <mat-form-field appearance="outline">
                <mat-label>Enter Location</mat-label>
                <input
                  matInput
                  [ngModel]="location()"
                  (ngModelChange)="location.set($event)"
                  placeholder="e.g., New Delhi"
                />
              </mat-form-field>
              <button mat-raised-button color="primary" (click)="loadWeather()" [disabled]="isLoadingWeather()">
                <mat-icon>cloud</mat-icon>
                Get Weather
              </button>
              <button mat-stroked-button color="primary" (click)="useCurrentLocationWeather()" [disabled]="isLoadingWeather()">
                <mat-icon>my_location</mat-icon>
                Use My Location
              </button>
            </div>

            @if (isLoadingWeather()) {
              <mat-spinner diameter="40"></mat-spinner>
            } @else if (weather()) {
              <div class="weather-data">
                <div class="current-weather">
                  <div class="weather-item">
                    <span class="label">🌡️ Temperature</span>
                    <span class="value">{{ weather()!.temperature }}°C</span>
                  </div>
                  <div class="weather-item">
                    <span class="label">💧 Humidity</span>
                    <span class="value">{{ weather()!.humidity }}%</span>
                  </div>
                  <div class="weather-item">
                    <span class="label">🌧️ Rain / Precipitation</span>
                    <span class="value">{{ weather()!.precipitation }} mm</span>
                  </div>
                  <div class="weather-item">
                    <span class="label">🌬️ Wind Speed</span>
                    <span class="value">{{ weather()!.wind_speed }} km/h</span>
                  </div>
                  <div class="weather-item">
                    <span class="label">☀️ Solar Radiation</span>
                    <span class="value">{{ weather()!.solar_radiation }} W/m²</span>
                  </div>
                  <div class="weather-item">
                    <span class="label">🌱 Soil Temperature (0 cm)</span>
                    <span class="value">{{ weather()!.soil_temperature_0cm }}°C</span>
                  </div>
                  <div class="weather-item">
                    <span class="label">🌱 Soil Moisture (0-1 cm)</span>
                    <span class="value">{{ weather()!.soil_moisture_0_1cm }}</span>
                  </div>
                </div>

                <div class="forecast">
                  <h3>Forecast</h3>
                  @for (day of weather()!.forecast; track $index) {
                    <div class="forecast-item">
                      <span class="day">{{ day.day }}</span>
                      <span class="temp">{{ day.temp }}°C</span>
                      <span class="condition">{{ day.condition }}</span>
                    </div>
                  }
                </div>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Market Prices Section -->
        <mat-card class="market-card">
          <mat-card-header>
            <mat-card-title>Market Prices (Mandi)</mat-card-title>
            <mat-card-subtitle>Track crop prices across markets</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="market-input">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Search Crop</mat-label>
                <input
                  matInput
                  [ngModel]="searchCrop()"
                  (ngModelChange)="searchCrop.set($event)"
                  (keyup.enter)="loadMarketPrices()"
                  placeholder="e.g., Rice, Wheat"
                />
              </mat-form-field>
              <button mat-raised-button color="accent" type="button" (click)="loadMarketPrices()" [disabled]="isLoadingPrices()">
                <mat-icon>search</mat-icon>
                Search Prices
              </button>
              <button mat-stroked-button color="primary" type="button" (click)="loadAllItemPrices()" [disabled]="isLoadingPrices()">
                <mat-icon>list</mat-icon>
                Prices
              </button>
            </div>

            @if (isLoadingPrices()) {
              <mat-spinner diameter="40"></mat-spinner>
            } @else if (marketPrices().length > 0) {
              <table mat-table [dataSource]="marketPrices()" class="prices-table">
                <!-- Crop Column -->
                <ng-container matColumnDef="crop_name">
                  <th mat-header-cell *matHeaderCellDef>Crop</th>
                  <td mat-cell *matCellDef="let element">{{ element.crop_name }}</td>
                </ng-container>

                <!-- Price Column -->
                <ng-container matColumnDef="price">
                  <th mat-header-cell *matHeaderCellDef>Price (₹/kg)</th>
                  <td mat-cell *matCellDef="let element" class="price-cell">₹{{ toPerKgPrice(element.price) | number:'1.2-2' }}/kg</td>
                </ng-container>

                <!-- Market Column -->
                <ng-container matColumnDef="market_name">
                  <th mat-header-cell *matHeaderCellDef>Market</th>
                  <td mat-cell *matCellDef="let element">{{ element.market_name }}</td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
              </table>
            } @else if (!isLoadingPrices()) {
              <p class="no-data">Search by crop or click "Prices" to view up to 100 market items</p>
            }
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card class="market-card">
        <mat-card-header>
          <mat-card-title>AI Farm Insights</mat-card-title>
          <mat-card-subtitle>Generate profit analysis and optimization suggestions</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="market-input">
            <mat-form-field appearance="outline">
              <mat-label>Yield (kg)</mat-label>
              <input matInput type="number" [ngModel]="insightYield()" (ngModelChange)="insightYield.set($event)" min="0" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Cost (₹)</mat-label>
              <input matInput type="number" [ngModel]="insightCost()" (ngModelChange)="insightCost.set($event)" min="0" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Revenue (₹)</mat-label>
              <input matInput type="number" [ngModel]="insightRevenue()" (ngModelChange)="insightRevenue.set($event)" min="0" />
            </mat-form-field>

            <button mat-raised-button color="primary" type="button" (click)="generateAIInsights()" [disabled]="isGeneratingInsights()">
              <mat-icon>auto_graph</mat-icon>
              {{ isGeneratingInsights() ? 'Analyzing...' : 'Generate AI Insights' }}
            </button>
          </div>

          @if (aiInsights()) {
            <div class="weather-data">
              <div class="current-weather">
                <div class="weather-item">
                  <span class="label">Profit</span>
                  <span class="value">₹{{ aiInsights()!.profit | number:'1.0-2' }}</span>
                </div>
              </div>

              <div class="forecast">
                <h3>Profit Analysis</h3>
                <p>{{ aiInsights()!.profitAnalysis }}</p>
                <h3>Income Suggestions</h3>
                <p>{{ aiInsights()!.incomeSuggestions }}</p>
                <h3>Cost Optimization</h3>
                <p>{{ aiInsights()!.costOptimization }}</p>
              </div>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </section>
  `,
  styles: [`
    .insights-section {
      padding: 24px;
    }

    h2 {
      color: #2e7d32;
      margin-bottom: 24px;
    }

    .insights-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
      margin-bottom: 24px;
    }

    .weather-card, .market-card {
      background: white;
    }

    .weather-input, .market-input {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      align-items: flex-end;
    }

    .full-width {
      width: 100%;
    }

    .weather-data {
      margin-top: 20px;
    }

    .current-weather {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .weather-item {
      display: flex;
      flex-direction: column;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 4px;

      .label {
        font-size: 12px;
        color: #999;
        margin-bottom: 4px;
      }

      .value {
        font-size: 18px;
        font-weight: 600;
        color: #2e7d32;
      }
    }

    .forecast {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;

      h3 {
        margin-top: 0;
        font-size: 14px;
        color: #666;
      }

      .forecast-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;

        .day {
          font-weight: 500;
          color: #333;
        }

        .temp {
          color: #2e7d32;
          font-weight: 600;
        }

        .condition {
          color: #999;
        }
      }
    }

    .prices-table {
      width: 100%;
      margin-top: 16px;

      th {
        background: #f5f5f5;
        color: #666;
        font-weight: 600;
        padding: 12px;
        text-align: left;
      }

      td {
        padding: 12px;
        border-bottom: 1px solid #e0e0e0;
      }

      .price-cell {
        color: #2e7d32;
        font-weight: 600;
      }
    }

    .no-data {
      color: #999;
      text-align: center;
      padding: 24px;
      font-style: italic;
    }

    mat-spinner {
      margin: 20px auto;
    }

    @media (max-width: 768px) {
      .insights-section {
        padding: 16px;
      }

      .insights-row {
        grid-template-columns: 1fr;
      }

      .weather-input, .market-input {
        flex-direction: column;
      }

      .current-weather {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsightsComponent {
  protected farmerService = inject(FarmerService);
  protected snackBar = inject(MatSnackBar);

  protected location = signal('');
  protected searchCrop = signal('');
  protected weather = signal<Weather | null>(null);
  protected marketPrices = signal<MarketPrice[]>([]);
  protected isLoadingWeather = signal(false);
  protected isLoadingPrices = signal(false);
  protected displayedColumns = ['crop_name', 'price', 'market_name'];
  protected insightYield = signal<number | null>(null);
  protected insightCost = signal<number | null>(null);
  protected insightRevenue = signal<number | null>(null);
  protected aiInsights = signal<AIInsightsResponse | null>(null);
  protected isGeneratingInsights = signal(false);

  protected toPerKgPrice(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return value > 100 ? Number((value / 100).toFixed(2)) : Number(value.toFixed(2));
  }

  protected loadWeather(): void {
    const loc = this.location().trim();
    if (!loc) return;

    this.isLoadingWeather.set(true);
    this.farmerService.getOpenMeteoWeatherByLocation(loc)
      .pipe(
        catchError(() => {
          this.snackBar.open('Unable to fetch weather for this location.', 'Close', { duration: 2800 });
          this.isLoadingWeather.set(false);
          return of(null);
        })
      )
      .subscribe(weather => {
        this.weather.set(weather);
        this.isLoadingWeather.set(false);
      });
  }

  protected useCurrentLocationWeather(): void {
    if (!navigator.geolocation) {
      this.snackBar.open('Geolocation is not supported in this browser.', 'Close', { duration: 2800 });
      return;
    }

    this.isLoadingWeather.set(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.farmerService
          .getOpenMeteoWeatherByCoordinates(latitude, longitude, 'Current Location')
          .pipe(
            catchError(() => {
              this.snackBar.open('Unable to fetch weather from your location.', 'Close', { duration: 2800 });
              this.isLoadingWeather.set(false);
              return of(null);
            })
          )
          .subscribe((weather) => {
            this.weather.set(weather);
            this.isLoadingWeather.set(false);
          });
      },
      () => {
        this.isLoadingWeather.set(false);
        this.snackBar.open('Location access denied. Please allow location permission.', 'Close', { duration: 3200 });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }

  protected loadMarketPrices(): void {
    this.fetchMarketPrices(false);
  }

  protected loadAllItemPrices(): void {
    this.fetchMarketPrices(true);
  }

  private fetchMarketPrices(loadAllItems: boolean): void {
    const crop = this.searchCrop().trim();
    this.isLoadingPrices.set(true);

    this.farmerService.getMarketPrices(crop || undefined, loadAllItems)
      .pipe(
        catchError(() => {
          this.snackBar.open('Unable to fetch market prices right now.', 'Close', { duration: 2800 });
          this.isLoadingPrices.set(false);
          return of([]);
        })
      )
      .subscribe(prices => {
        this.marketPrices.set(prices);
        this.isLoadingPrices.set(false);
      });
  }

  protected generateAIInsights(): void {
    const yieldValue = Number(this.insightYield());
    const cost = Number(this.insightCost());
    const revenue = Number(this.insightRevenue());

    if (!Number.isFinite(yieldValue) || !Number.isFinite(cost) || !Number.isFinite(revenue) || yieldValue < 0 || cost < 0 || revenue < 0) {
      this.snackBar.open('Enter valid yield, cost, and revenue values', 'Close', { duration: 2600 });
      return;
    }

    this.isGeneratingInsights.set(true);
    this.farmerService
      .generateAIInsights({
        yield: yieldValue,
        cost,
        revenue,
      })
      .pipe(
        catchError(() => {
          this.snackBar.open('Unable to generate AI insights', 'Close', { duration: 2800 });
          this.isGeneratingInsights.set(false);
          return of(null);
        })
      )
      .subscribe((response) => {
        if (response) {
          this.aiInsights.set(response);
        }
        this.isGeneratingInsights.set(false);
      });
  }
}
