import { Routes } from '@angular/router';
import { CardListComponent } from './pages/card-list/card-list.component';
import { CardDetailComponent } from './pages/card-detail/card-detail.component';
import { LoginComponent } from './pages/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { CardFormComponent } from './pages/card-form/card-form.component';

export const routes: Routes = [
  { path: '', redirectTo: 'cards', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'cards', component: CardListComponent },
  { path: 'cards/:id', component: CardDetailComponent },
  { path: 'admin', redirectTo: 'admin/cards/new', pathMatch: 'full' },
  {
    path: 'admin/cards/new',
    component: CardFormComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/cards/:id/edit',
    component: CardFormComponent,
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: 'cards' }
];


