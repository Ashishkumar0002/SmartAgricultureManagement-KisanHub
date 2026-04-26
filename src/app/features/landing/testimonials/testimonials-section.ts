import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { ScrollRevealDirective } from '../scroll-reveal.directive';

type TestimonialItem = {
  name: string;
  role: string;
  quote: string;
};

@Component({
  selector: 'app-testimonials-section',
  standalone: true,
  imports: [MatIconModule, ScrollRevealDirective],
  templateUrl: './testimonials-section.html',
  styleUrl: './testimonials-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestimonialsSectionComponent {
  protected readonly testimonials: readonly TestimonialItem[] = [
    {
      name: 'Rakesh Singh',
      role: 'Farmer, Punjab',
      quote: 'Crop planning and advisory helped me reduce losses and improve seasonal output.',
    },
    {
      name: 'Meena Devi',
      role: 'Farmer, Bihar',
      quote: 'I now get quick market updates and better selling rates through one platform.',
    },
    {
      name: 'Arun Patel',
      role: 'Agriculture Expert',
      quote: 'Expert dashboard and farmer communication are smooth and easy to manage daily.',
    },
  ];
}
