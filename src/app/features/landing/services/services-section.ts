import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

import { ScrollRevealDirective } from '../scroll-reveal.directive';

type ServiceItem = {
  title: string;
  description: string;
  image: string;
};

@Component({
  selector: 'app-services-section',
  standalone: true,
  imports: [MatCardModule, ScrollRevealDirective],
  templateUrl: './services-section.html',
  styleUrl: './services-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicesSectionComponent {
  protected readonly services: readonly ServiceItem[] = [
    {
      title: 'Agricultural Consulting',
      description: 'One-on-one guidance from specialists for practical farm decisions.',
      image: 'https://images.unsplash.com/photo-1592982537447-6f2a6a0f9b3f?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Crop Planning',
      description: 'Season-wise planning based on climate, soil, and local market trends.',
      image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Disease Detection',
      description: 'Spot crop diseases early with quick digital reporting and action plans.',
      image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Equipment Sharing',
      description: 'Access farm machines near you without the cost of full ownership.',
      image: 'https://images.unsplash.com/photo-1651587350032-95e0318a4327?auto=format&fit=crop&w=1200&q=80',
    },
  ];
}
