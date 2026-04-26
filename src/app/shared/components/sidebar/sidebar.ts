import { Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../shared/models/role.model';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [MatIconModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private readonly authService = inject(AuthService);

  private readonly menuByRole: Record<UserRole, NavItem[]> = {
    admin: [
      { label: 'Overview Dashboard', icon: 'dashboard', route: '/admin/dashboard' },
      { label: 'Farm Management', icon: 'agriculture', route: '/farmer/farms' },
      { label: 'Crop Management', icon: 'grass', route: '/farmer/crops' },
      { label: 'User Management', icon: 'groups', route: '/admin/users' },
    ],
    farmer: [
      { label: 'Overview Dashboard', icon: 'dashboard', route: '/dashboard' },
      { label: 'Farm Management', icon: 'agriculture', route: '/farmer/farms' },
      { label: 'Crop Management', icon: 'grass', route: '/farmer/crops' },
      { label: 'Ask Expert', icon: 'support_agent', route: '/advisory/ask' },
      { label: 'Market Prices', icon: 'price_check', route: '/market/prices' },
      { label: 'Sell Products', icon: 'storefront', route: '/market/sell' },
    ],
    expert: [
      { label: 'Overview Dashboard', icon: 'science', route: '/expert/dashboard' },
    ],
  };

  protected readonly navItems = computed(() => {
    const role = this.authService.userRole();
    return role ? this.menuByRole[role] : [];
  });

  protected readonly homeRoute = computed(() => {
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
  });
}
