import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { LandingNavbarComponent } from '../navbar/navbar';
import { LandingHeroComponent } from '../hero/hero';
import { AboutSectionComponent } from '../about/about.component';
import { FeaturesSectionComponent } from '../features/features-section';
import { ServicesSectionComponent } from '../services/services-section';
import { WhyChooseSectionComponent } from '../why-choose/why-choose-section';
import { TestimonialsSectionComponent } from '../testimonials/testimonials-section';
import { CtaSectionComponent } from '../cta/cta-section';
import { LandingFooterComponent } from '../footer/footer';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage {
  protected readonly landingNavbarComponent = LandingNavbarComponent;
  protected readonly landingHeroComponent = LandingHeroComponent;
  protected readonly aboutSectionComponent = AboutSectionComponent;
  protected readonly featuresSectionComponent = FeaturesSectionComponent;
  protected readonly servicesSectionComponent = ServicesSectionComponent;
  protected readonly whyChooseSectionComponent = WhyChooseSectionComponent;
  protected readonly testimonialsSectionComponent = TestimonialsSectionComponent;
  protected readonly ctaSectionComponent = CtaSectionComponent;
  protected readonly landingFooterComponent = LandingFooterComponent;
}
