import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

import { ScrollRevealDirective } from '../scroll-reveal.directive';

@Component({
  selector: 'app-cta-section',
  standalone: true,
  imports: [RouterLink, MatButtonModule, ScrollRevealDirective],
  templateUrl: './cta-section.html',
  styleUrl: './cta-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CtaSectionComponent {}
