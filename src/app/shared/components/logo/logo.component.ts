import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

type LogoTone = 'brand' | 'light' | 'dark';

@Component({
  selector: 'app-logo',
  imports: [RouterLink],
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent {
  protected readonly imagePath = 'assets/branding/kisanhub-logo.jpg';
  protected readonly fallbackPath = 'assets/branding/kisanhub-logo.svg';

  readonly homeRoute = input('/');
  readonly logoHeight = input(36);
  readonly textSize = input(20);
  readonly tone = input<LogoTone>('brand');

  protected onImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (image.src.includes(this.fallbackPath)) {
      return;
    }
    image.src = this.fallbackPath;
  }
}
