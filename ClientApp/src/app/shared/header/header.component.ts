import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="bg-gray-100 px-4 py-2 flex justify-between items-center">
      <div class="text-xl font-bold cursor-pointer" (click)="goHome()">
        Időskor
      </div>
      <div class="space-x-4">
        <a routerLink="/cards" class="hover:underline">Home</a>
        <ng-container *ngIf="!auth.isAdmin">
           <a routerLink="/login">Login</a>
        </ng-container>

        <ng-container *ngIf="auth.isAdmin">
          <a routerLink="/admin">Admin</a>
          <button (click)="logout()">Logout</button>
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
