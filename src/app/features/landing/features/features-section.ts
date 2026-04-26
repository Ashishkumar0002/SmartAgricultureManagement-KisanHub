import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { ScrollRevealDirective } from '../scroll-reveal.directive';

type FeatureItem = {
  icon: string;
  title: string;
  description: string;
};

@Component({
  selector: 'app-features-section',
  standalone: true,
  imports: [MatCardModule, MatIconModule, ScrollRevealDirective],
  templateUrl: './features-section.html',
  styleUrl: './features-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturesSectionComponent {
  protected readonly features: readonly FeatureItem[] = [
    {
      icon: 'agriculture',
      title: 'Digital Farm Management',
      description: 'Track land, crops, and farm tasks from one simple smart dashboard.',
    },
    {
      icon: 'monitor_heart',
      title: 'Crop Monitoring',
      description: 'Monitor crop health and growth stages with timely digital updates.',
    },
    {
      icon: 'tips_and_updates',
      title: 'Smart Advisory',
      description: 'Receive tailored advice from experts for crop care and productivity.',
    },
    {
      icon: 'precision_manufacturing',
      title: 'Equipment Rental',
      description: 'Find and rent farming equipment when you need it, without delays.',
    },
    {
      icon: 'groups',
      title: 'Labor Management',
      description: 'Discover skilled labor and coordinate farm workforce effectively.',
    },
    {
      icon: 'storefront',
      title: 'Marketplace',
      description: 'Sell produce smarter with transparent pricing and demand insights.',
    },
  ];
}
