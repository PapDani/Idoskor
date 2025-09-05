import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PageDto {
  key: string;
  title: string;
  content: string; // HTML
  updatedUtc?: string;
}

@Injectable({ providedIn: 'root' })
export class PagesService {
  private http = inject(HttpClient);
  private base = '/api/Pages';

  list(): Observable<PageDto[]> {
    return this.http.get<PageDto[]>(this.base);
  }

  get(key: string) {
    return this.http.get<PageDto>(`${this.base}/${encodeURIComponent(key)}`);
  }

  update(key: string, body: { title: string; content: string }) {
    return this.http.put<void>(`${this.base}/${encodeURIComponent(key)}`, body);
  }
}
