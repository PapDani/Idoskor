import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="max-w-sm mx-auto p-4">
      <h2 class="text-xl mb-4">Admin Login</h2>
      <form (ngSubmit)="onSubmit()">
        <input [(ngModel)]="username" name="username" placeholder="Username" class="w-full mb-2 p-2 border" required />
        <input [(ngModel)]="password" name="password" type="password" placeholder="Password" class="w-full mb-4 p-2 border" required />
        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded">Login</button>
      </form>
      <p *ngIf="error" class="text-red-600 mt-2">Login failed</p>
    </div>
  `
})
export class LoginComponent {
  username = '';
  password = '';
  error = false;

  constructor(private auth: AuthService, private router: Router) { }

  onSubmit() {
    this.auth.login(this.username, this.password).subscribe({
      next: () => this.router.navigate(['/admin/cards']),
      error: () => this.error = true
    });
  }
}
