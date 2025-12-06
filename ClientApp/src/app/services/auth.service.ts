import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { API_BASE_URL } from '../api.config';

export interface LoginResponse {
  token: string;
  expiresAt?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  // KÖZVETLENÜL A BACKENDRE MUTAT:
  // API_BASE_URL pl.: 'https://idoskor.onrender.com/api'
  private readonly api = `${API_BASE_URL}/auth`;

  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    return this.http
      .post<LoginResponse>(`${this.api}/login`, { username, password })
      .pipe(
        tap(res => {
          if (res?.token) {
            localStorage.setItem('jwt', res.token);
          }
        })
      );
  }

  logout() {
    localStorage.removeItem('jwt');
  }

  get token(): string | null {
    return localStorage.getItem('jwt');
  }

  get isAdmin(): boolean {
    return !!this.token;
  }
}
