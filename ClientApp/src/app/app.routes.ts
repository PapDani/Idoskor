import { AuthGuard } from './guards/auth.guard';
import { CardListComponent } from './pages/card-list/card-list.component';
import { Routes } from '@angular/router';
import { CardDetailComponent } from './pages/card-detail/card-detail.component';
import { LoginComponent } from './pages/login/login.component';

export const routes: Routes = [
  { path: '', redirectTo: 'cards', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  {
    path: 'admin',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./pages/admin-dashboard/admin-dashboard.component')
        .then(m => m.AdminDashboardComponent),
    children: [
      { path: '', redirectTo: 'cards', pathMatch: 'full' },
      {
        path: 'cards', loadComponent: () =>
          import('./pages/admin-card-list/admin-card-list.component')
            .then(m => m.AdminCardsComponent),
      },
      {
        path: 'cards/new', loadComponent: () =>
          import('./pages/card-form/card-form.component')
            .then(m => m.CardFormComponent)
      },
      {
        path: 'cards/:id/edit', loadComponent: () =>
          import('./pages/card-form/card-form.component')
            .then(m => m.CardFormComponent)
      }
    ]
  },

  { path: 'cards', component: CardListComponent },
  { path: 'cards/:id', component: CardDetailComponent },
  { path: '**', redirectTo: 'cards' }
];
