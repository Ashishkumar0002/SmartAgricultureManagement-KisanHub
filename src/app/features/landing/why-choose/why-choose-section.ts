import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { ScrollRevealDirective } from '../scroll-reveal.directive';

type ReasonItem = {
  icon: string;
  title: string;
  text: string;
};

@Component({
  selector: 'app-why-choose-section',
  standalone: true,
  imports: [MatIconModule, ScrollRevealDirective],
  templateUrl: './why-choose-section.html',
  styleUrl: './why-choose-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhyChooseSectionComponent {
  protected readonly reasons: readonly ReasonItem[] = [
    {
      icon: 'memory',
      title: 'Smart Technology',
      text: 'Built with real farm workflows, predictive analytics, and practical automation.',
    },
    {
      icon: 'support_agent',
      title: 'Expert Support',
      text: 'Direct support from agricultural professionals and domain specialists.',
    },
    {
      icon: 'query_stats',
      title: 'Real-time Insights',
      text: 'Get weather, prices, and crop alerts at the right time for better decisions.',
    },
    {
      icon: 'touch_app',
      title: 'Easy to Use',
      text: 'Simple experience for farmers, experts, and admins across devices.',
    },
  ];
}
