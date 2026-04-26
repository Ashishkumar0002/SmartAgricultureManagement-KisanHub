import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { FarmerRegister } from './features/auth/farmer-register/farmer-register';
import { ExpertRegister } from './features/auth/expert-register/expert-register';
import { MainDashboard } from './features/dashboard/main-dashboard/main-dashboard';
import { FarmManagement } from './features/farmer/farm-management/farm-management';
import { CropManagement } from './features/farmer/crop-management/crop-management';
import { AskExpert } from './features/advisory/ask-expert/ask-expert';
import { JobPost } from './features/employment/job-post/job-post';
import { Workers } from './features/employment/workers/workers';
import { PriceList } from './features/market/price-list/price-list';
import { SellProducts } from './features/market/sell-products/sell-products';
import { AdminDashboard } from './features/admin/admin-dashboard/admin-dashboard';
import { UserManagement } from './features/admin/user-management/user-management';
import { ExpertDashboard } from './features/expert/expert-dashboard/expert-dashboard';
import { CropInformationComponent } from './features/farmer/crop-information/crop-information';
import { FarmerDashboard } from './features/farmer/farmer-dashboard';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		loadComponent: () => import('./features/landing/landing-page/landing-page').then((m) => m.LandingPage),
	},
	{
		path: 'home',
		pathMatch: 'full',
		redirectTo: '',
	},
	{
		path: 'auth/login',
		component: Login,
	},
	{
		path: 'auth/register',
		component: Register,
	},
	{
		path: 'auth/register/farmer',
		component: FarmerRegister,
	},
	{
		path: 'auth/register/expert',
		component: ExpertRegister,
	},
	{
		path: 'dashboard',
		component: MainDashboard,
		canActivate: [authGuard],
	},
	{
		path: 'farmer/dashboard',
		component: FarmerDashboard,
		canActivate: [authGuard, roleGuard],
		data: { roles: ['farmer'] },
	},
	{
		path: 'farmer/farms',
		component: FarmManagement,
		canActivate: [authGuard, roleGuard],
		data: { roles: ['farmer', 'admin'] },
	},
	{
		path: 'farmer/crops',
		component: CropManagement,
		canActivate: [authGuard, roleGuard],
		data: { roles: ['farmer', 'admin'] },
	},
	{
		path: 'farmer/crop-info',
		component: CropInformationComponent,
		canActivate: [authGuard, roleGuard],
		data: { roles: ['farmer', 'expert', 'admin'] },
	},
	{
		path: 'advisory/ask',
		component: AskExpert,
		canActivate: [authGuard, roleGuard],
		data: { roles: ['farmer'] },
	},
	{
		path: 'employment/jobs',
		component: JobPost,
		canActivate: [authGuard],
	},
	{
		path: 'employment/workers',
		component: Workers,
		canActivate: [authGuard],
	},
	{
		path: 'market/prices',
		component: PriceList,
		canActivate: [authGuard, roleGuard],
		data: { roles: ['farmer'] },
	},
	{
		path: 'market/sell',
		component: SellProducts,
		canActivate: [authGuard, roleGuard],
		data: { roles: ['farmer'] },
	},
	{
		path: 'admin/dashboard',
		component: AdminDashboard,
		canActivate: [authGuard, roleGuard],
		data: { roles: ['admin'] },
	},
	{
		path: 'admin/users',
		component: UserManagement,
		canActivate: [authGuard, roleGuard],
		data: { roles: ['admin'] },
	},
	{
		path: 'expert/dashboard',
		component: ExpertDashboard,
		canActivate: [authGuard, roleGuard],
		data: { roles: ['expert'] },
	},
	{
		path: '**',
		redirectTo: '',
	},
];
