import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { CardListComponent } from './pages/card-list/card-list.component';
import { CardDetailComponent } from './pages/card-detail/card-detail.component';
import { LoginComponent } from './pages/login/login.component';

export const routes: Routes = [
  { path: '', redirectTo: 'cards', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  // Publikus cikkoldal
  {
    path: 'pages/:key',
    loadComponent: () =>
      import('./pages/public-page/public-page.component')
        .then(m => m.PublicPageComponent),
  },

  // Admin ág
  {
    path: 'admin',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/admin-dashboard/admin-dashboard.component')
            .then(m => m.AdminDashboardComponent),
      },

      // Oldalak (lista) + szerkesztő (ha használod)
      {
        path: 'pages',
        loadComponent: () =>
          import('./pages/admin-page-list/admin-page-list.component')
            .then(m => m.AdminPagesListComponent),
      },
      {
        path: 'pages/:key',
        loadComponent: () =>
          import('./pages/admin-page-edit/admin-page-edit.component')
            .then(m => m.AdminPageEditComponent),
      },

      // >>> ITT A LÉNYEG: Admin kártyalista <<<
      {
        path: 'cards',
        loadComponent: () =>
          import('./pages/admin-card-list/admin-card-list.component')
            .then(m => m.AdminCardsComponent),
      },
      {
        path: 'cards/new',
        loadComponent: () =>
          import('./pages/card-form/card-form.component')
            .then(m => m.CardFormComponent),
      },
      {
        path: 'cards/:id/edit',
        loadComponent: () =>
          import('./pages/card-form/card-form.component')
            .then(m => m.CardFormComponent),
      },
    ],
  },

  // Publikus kártyanézetek
  { path: 'cards', component: CardListComponent },
  { path: 'cards/:id', component: CardDetailComponent },

  { path: '**', redirectTo: 'cards' },
];
