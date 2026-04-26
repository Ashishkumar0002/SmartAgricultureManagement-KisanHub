import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { catchError, of } from 'rxjs';

import {
  FarmerService,
  FarmerDashboardStats,
  FarmerProfile,
  GovernmentScheme,
  MarketNews,
  MarketPrice,
  Weather,
} from '../../core/services/farmer.service';
import { AuthService } from '../../core/services/auth.service';

// Import all farmer modules
import { FarmProfileComponent } from './farm-profile.component';
import { InsightsComponent } from './insights.component';
import { AskExpertComponent } from './ask-expert.component';
import { CropInfoComponent } from './crop-info.component';
import { WorkersComponent } from './workers.component';
import { EquipmentRentalComponent } from './equipment-rental.component';
import { FarmingTechniquesComponent } from './farming-techniques.component';
import { FarmerEmployment } from './employment/employment';
import { FarmerAlertsComponent } from './farmer-alerts.component';

@Component({
  selector: 'app-farmer-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatCardModule,
    MatMenuModule,
    MatDividerModule,
    MatBadgeModule,
    MatFormFieldModule,
    MatSelectModule,
    FarmProfileComponent,
    InsightsComponent,
    AskExpertComponent,
    CropInfoComponent,
    WorkersComponent,
    EquipmentRentalComponent,
    FarmingTechniquesComponent,
    FarmerEmployment,
    FarmerAlertsComponent,
  ],
  templateUrl: './farmer-dashboard.html',
  styleUrl: './farmer-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmerDashboard {
  protected authService = inject(AuthService);
  private farmerService = inject(FarmerService);
  private destroyRef = inject(DestroyRef);

  protected currentUser = this.authService.currentUser;
  protected selectedMenuItem = signal<string>('overview');

  protected stats = signal<FarmerDashboardStats | null>(null);
  protected profile = signal<FarmerProfile | null>(null);
  protected weather = signal<Weather | null>(null);
  protected marketPrices = signal<MarketPrice[]>([]);
  protected marketNews = signal<MarketNews[]>([]);
  protected governmentSchemes = signal<GovernmentScheme[]>([]);
  protected alertCount = signal(0);
  protected isLoadingStats = signal(false);
  protected isLoadingNews = signal(false);
  protected isLoadingSchemes = signal(false);
  protected activeNewsIndex = signal(0);
  protected selectedSchemeScope = signal<'ministry' | 'state' | 'both'>('both');

  private newsRotationTimer: ReturnType<typeof setInterval> | null = null;
  private alertsRefreshTimer: ReturnType<typeof setInterval> | null = null;
  private readonly defaultSchemes: GovernmentScheme[] = [
    {
      scheme_name: 'PM-KISAN',
      ministry: 'Ministry of Agriculture & Farmers Welfare',
      state: 'All India',
      description: 'Income support scheme for eligible farmer families.',
      source_url: 'https://pmkisan.gov.in/',
    },
    {
      scheme_name: 'Pradhan Mantri Fasal Bima Yojana',
      ministry: 'Ministry of Agriculture & Farmers Welfare',
      state: 'All India',
      description: 'Crop insurance support against yield losses and climate risks.',
      source_url: 'https://pmfby.gov.in/',
    },
    {
      scheme_name: 'Kisan Credit Card',
      ministry: 'Department of Financial Services',
      state: 'All India',
      description: 'Affordable institutional credit for crop and allied activities.',
      source_url: 'https://www.myscheme.gov.in/',
    },
    {
      scheme_name: 'Soil Health Card Scheme',
      ministry: 'Ministry of Agriculture & Farmers Welfare',
      state: 'All India',
      description: 'Soil nutrient assessment and advisory for balanced fertilizer usage.',
      source_url: 'https://soilhealth.dac.gov.in/',
    },
    {
      scheme_name: 'Punjab Crop Residue Management Support',
      ministry: null,
      state: 'Punjab',
      description: 'State support for in-situ crop residue and farm mechanization adoption.',
      source_url: null,
    },
    {
      scheme_name: 'Maharashtra Micro-Irrigation Support',
      ministry: null,
      state: 'Maharashtra',
      description: 'State-backed subsidy assistance for drip and sprinkler irrigation systems.',
      source_url: null,
    },
    {
      scheme_name: 'RKVY State Agriculture Initiative',
      ministry: 'Ministry of Agriculture & Farmers Welfare',
      state: 'Karnataka',
      description: 'Joint centre-state support for agriculture infrastructure and value chain projects.',
      source_url: 'https://rkvy.nic.in/',
    },
    {
      scheme_name: 'National Food Security Mission (State Component)',
      ministry: 'Ministry of Agriculture & Farmers Welfare',
      state: 'Uttar Pradesh',
      description: 'State implementation support for productivity enhancement in major crops.',
      source_url: 'https://nfsm.gov.in/',
    },
  ];

  protected menuItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: 'dashboard', badge: 0 },
    { id: 'farm', label: 'My Farm', icon: 'agriculture', badge: 0 },
    { id: 'insights', label: 'Insights', icon: 'insights', badge: 0 },
    { id: 'alerts', label: 'Alerts', icon: 'warning', badge: 0 },
    { id: 'expert', label: 'Ask Expert', icon: 'support_agent', badge: 0 },
    { id: 'crops', label: 'Crop Information', icon: 'grass', badge: 0 },
    { id: 'employment', label: 'Employment / Jobs', icon: 'work', badge: 0 },
    { id: 'workers', label: 'Workers', icon: 'people', badge: 0 },
    { id: 'equipment', label: 'Equipment Rental', icon: 'construction', badge: 0 },
    { id: 'techniques', label: 'Farming Techniques', icon: 'lightbulb', badge: 0 },
  ];

  protected isMenuOpen = signal(true);

  constructor() {
    this.loadOverview();
    this.startAlertsRefresh();
    this.destroyRef.onDestroy(() => {
      this.stopNewsRotation();
      this.stopAlertsRefresh();
    });
  }

  protected topMarketPrice = computed(() => {
    const prices = this.marketPrices();
    if (!prices.length) {
      return null;
    }
    return [...prices].sort((a, b) => b.price - a.price)[0];
  });

  protected weatherLabel = computed(() => {
    const weather = this.weather();
    if (!weather) {
      return 'Unavailable';
    }
    return `${weather.temperature}degC, ${weather.forecast[0]?.condition ?? 'Clear'}`;
  });

  protected marketLabel = computed(() => {
    const top = this.topMarketPrice();
    if (!top) {
      return 'No market data';
    }

    const perKgPrice = top.price > 100 ? Number((top.price / 100).toFixed(2)) : Number(top.price.toFixed(2));
    return `${top.crop_name}: Rs ${perKgPrice}`;
  });

  protected activeNews = computed(() => {
    const articles = this.marketNews();
    if (!articles.length) {
      return null;
    }
    const index = this.activeNewsIndex() % articles.length;
    return articles[index];
  });

  protected newsFilters = ['agriculture', 'farming', 'किसान', 'mandi', 'crop', 'irrigation', 'fertilizer'];

  protected activeNewsCounter = computed(() => {
    const total = this.marketNews().length;
    if (!total) {
      return '0 / 0';
    }
    return `${this.activeNewsIndex() + 1} / ${total}`;
  });

  protected filteredSchemes = computed(() => {
    const scope = this.selectedSchemeScope();

    return this.governmentSchemes().filter((scheme) => {
      const hasMinistry = !!scheme.ministry?.trim();
      const stateValue = scheme.state?.trim().toLowerCase() ?? '';
      const hasState = !!stateValue;
      const isNationalScope = !stateValue || stateValue === 'all india' || stateValue === 'india';

      if (scope === 'ministry') {
        return hasMinistry && isNationalScope;
      }
      if (scope === 'state') {
        return hasState && !isNationalScope;
      }
      return hasMinistry && hasState && !isNationalScope;
    });
  });

  private loadOverview(): void {
    this.isLoadingStats.set(true);
    this.loadMarketNews();
    this.loadGovernmentSchemes();
    this.loadFarmerAlerts();

    this.farmerService.getFarmerProfile()
      .pipe(
        catchError(() => {
          return of(null);
        })
      )
      .subscribe(profile => {
        this.profile.set(profile);

        this.farmerService.getDashboardStats()
          .pipe(catchError(() => of(null)))
          .subscribe(stats => this.stats.set(stats));

        if (profile?.location) {
          this.farmerService.getOpenMeteoWeatherByLocation(profile.location)
            .pipe(catchError(() => of(null)))
            .subscribe(weather => this.weather.set(weather));
        }

        this.farmerService.getMarketPrices()
          .pipe(catchError(() => of([])))
          .subscribe(prices => {
            this.marketPrices.set(prices);
            this.isLoadingStats.set(false);
          });
      });
  }

  private loadGovernmentSchemes(): void {
    this.isLoadingSchemes.set(true);
    this.farmerService.getGovernmentSchemes(undefined, undefined, 100)
      .pipe(catchError(() => of([])))
      .subscribe((schemes) => {
        const merged = [...schemes, ...this.defaultSchemes];
        const dedupe = new Map<string, GovernmentScheme>();
        for (const scheme of merged) {
          const key = `${scheme.scheme_name}|${scheme.ministry ?? ''}|${scheme.state ?? ''}`.toLowerCase();
          if (!dedupe.has(key)) {
            dedupe.set(key, scheme);
          }
        }
        this.governmentSchemes.set([...dedupe.values()]);
        this.isLoadingSchemes.set(false);
      });
  }

  private loadMarketNews(): void {
    this.isLoadingNews.set(true);
    this.farmerService.getMarketNews(10)
      .pipe(catchError(() => of([])))
      .subscribe((articles) => {
        this.marketNews.set(articles);
        this.activeNewsIndex.set(0);
        this.isLoadingNews.set(false);
        this.startNewsRotation();
      });
  }

  private loadFarmerAlerts(): void {
    this.farmerService.getFarmerAlerts(30)
      .pipe(catchError(() => of([])))
      .subscribe((alerts) => {
        this.alertCount.set(alerts.length);
        const alertMenu = this.menuItems.find((item) => item.id === 'alerts');
        if (alertMenu) {
          alertMenu.badge = alerts.length;
        }
      });
  }

  private startAlertsRefresh(): void {
    this.stopAlertsRefresh();
    this.alertsRefreshTimer = setInterval(() => this.loadFarmerAlerts(), 30000);
  }

  private stopAlertsRefresh(): void {
    if (this.alertsRefreshTimer) {
      clearInterval(this.alertsRefreshTimer);
      this.alertsRefreshTimer = null;
    }
  }

  private startNewsRotation(): void {
    this.stopNewsRotation();
    if (this.marketNews().length < 2) {
      return;
    }

    this.newsRotationTimer = setInterval(() => {
      const total = this.marketNews().length;
      if (!total) {
        return;
      }
      this.activeNewsIndex.update((index) => (index + 1) % total);
    }, 5000);
  }

  private stopNewsRotation(): void {
    if (this.newsRotationTimer) {
      clearInterval(this.newsRotationTimer);
      this.newsRotationTimer = null;
    }
  }

  protected selectMenuItem(itemId: string): void {
    this.selectedMenuItem.set(itemId);
    if (itemId === 'overview') {
      this.loadOverview();
    }
  }

  protected toggleMenu(): void {
    this.isMenuOpen.update(v => !v);
  }

  protected logout(): void {
    this.authService.logout();
  }
}
