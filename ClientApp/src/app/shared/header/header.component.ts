import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="flex items-center justify-between p-4 bg-gray-100">
      <div class="text-xl font-bold cursor-pointer" (click)="goHome()">Időskor</div>
      <div class="space-x-4">
        <a routerLink="/cards" class="hover:underline">Home</a>

        <ng-container *ngIf="!auth.isAdmin">
          <a routerLink="/login" class="hover:underline">Login</a>
        </ng-container>

        <ng-container *ngIf="auth.isAdmin">
          <!-- IDE kerüljön az admin-menü -->
          <a routerLink="/admin/cards" class="hover:underline">Edit cards</a>
          <a routerLink="/admin/cards/new" class="hover:underline">New card</a>
          <button (click)="logout()" class="hover:underline">Logout</button>
        </ng-container>
      </div>
    </nav>
  `
})
export class HeaderComponent {
  constructor(public auth: AuthService, private router: Router) { }

  goHome() {
    this.router.navigate(['/cards']);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
