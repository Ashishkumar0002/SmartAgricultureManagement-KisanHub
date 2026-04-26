import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [MatToolbarModule, MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  constructor(
    protected readonly authService: AuthService,
    private readonly router: Router
  ) {}

  protected homeRoute(): string {
    const role = this.authService.userRole();
    if (role === 'admin') {
      return '/admin/dashboard';
    }
    if (role === 'farmer') {
      return '/farmer/dashboard';
    }
    if (role === 'expert') {
      return '/expert/dashboard';
    }
    return '/';
  }

  protected logout() {
    this.authService.logout();
  }
}
