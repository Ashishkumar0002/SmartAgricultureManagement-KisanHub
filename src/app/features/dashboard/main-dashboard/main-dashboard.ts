import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

import { CropService } from '../../../core/services/crop.service';
import { FarmerService } from '../../../core/services/farmer.service';
import { AdvisoryService } from '../../../core/services/advisory.service';

@Component({
  selector: 'app-main-dashboard',
  imports: [NgFor, NgIf, MatCardModule, MatProgressSpinnerModule, BaseChartDirective],
  templateUrl: './main-dashboard.html',
  styleUrl: './main-dashboard.scss',
})
export class MainDashboard {
  protected loading = true;
  protected summaryCards = [
    { title: 'Total Farms', value: 0 },
    { title: 'Total Crops', value: 0 },
    { title: 'Advisory Requests', value: 0 },
  ];

  protected pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#2e7d32', '#66bb6a', '#8bc34a', '#c5e1a5'] }],
  };

  protected barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'Land Usage (acres)', backgroundColor: '#66bb6a' }],
  };

  protected lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{ data: [14, 19, 24, 30, 37, 43], label: 'Growth Trend', borderColor: '#2e7d32', tension: 0.35 }],
  };

  constructor(
    private readonly farmerService: FarmerService,
    private readonly cropService: CropService,
    private readonly advisoryService: AdvisoryService
  ) {
    this.loadDashboard();
  }

  private loadDashboard() {
    forkJoin({
      farmers: this.farmerService.getFarmers(),
      crops: this.cropService.getCrops(),
      advisories: this.advisoryService.getAdvisories(),
    }).subscribe({
      next: ({ farmers, crops, advisories }) => {
        this.summaryCards = [
          { title: 'Total Farms', value: farmers.length },
          { title: 'Total Crops', value: crops.length },
          { title: 'Advisory Requests', value: advisories.length },
        ];

        const cropCount = new Map<string, number>();
        crops.forEach((crop) => cropCount.set(crop.name, (cropCount.get(crop.name) ?? 0) + 1));

        this.pieChartData = {
          labels: Array.from(cropCount.keys()),
          datasets: [{ data: Array.from(cropCount.values()), backgroundColor: ['#2e7d32', '#66bb6a', '#8bc34a', '#c5e1a5'] }],
        };

        this.barChartData = {
          labels: farmers.map((farmer) => farmer.name),
          datasets: [{ data: farmers.map((farmer) => farmer.total_land), label: 'Land Usage (acres)', backgroundColor: '#66bb6a' }],
        };

        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
