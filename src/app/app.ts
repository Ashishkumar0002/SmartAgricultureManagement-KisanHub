import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { AuthService } from './core/services/auth.service';
import { Footer } from './shared/components/footer/footer';
import { Navbar } from './shared/components/navbar/navbar';
import { Sidebar } from './shared/components/sidebar/sidebar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Sidebar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  protected readonly authService = inject(AuthService);
  private readonly routeEvents = toSignal(
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)),
    { initialValue: null }
  );

  protected readonly isAuthRoute = computed(
    () => {
      this.routeEvents();
      return this.router.url.startsWith('/auth/login') || this.router.url.startsWith('/auth/register');
    }
  );

  protected readonly isLandingRoute = computed(() => {
    this.routeEvents();
    return this.router.url === '/' || this.router.url === '/home';
  });

  protected readonly showGlobalSidebar = computed(() => {
    this.routeEvents();
    return !this.router.url.startsWith('/farmer/dashboard') && !this.router.url.startsWith('/admin/dashboard');
  });
}
