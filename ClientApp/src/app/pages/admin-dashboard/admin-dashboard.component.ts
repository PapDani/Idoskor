import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <router-outlet></router-outlet>
    </div>
  `
})
export class AdminDashboardComponent { }
