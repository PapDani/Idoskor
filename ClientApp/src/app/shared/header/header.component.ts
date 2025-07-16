import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar color="primary">
      <span class="cursor-pointer" (click)="goHome()">Időskor</span>
      <span class="spacer"></span>

      <ng-container *ngIf="!auth.isAdmin">
        <button mat-button routerLink="/cards">Home</button>
        <button mat-button routerLink="/login">Login</button>
      </ng-container>

      <ng-container *ngIf="auth.isAdmin">
        <button mat-button routerLink="/admin/cards">Edit cards</button>
        <button mat-button routerLink="/admin/cards/new">New card</button>
        <button mat-button (click)="logout()">Logout</button>
      </ng-container>
    </mat-toolbar>
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
