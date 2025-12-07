import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';

export interface PageDto {
  key: string;
  title: string;
  content: string; // HTML
  updatedUtc?: string;
}

@Injectable({ providedIn: 'root' })
export class PagesService {
  //private readonly baseUrl = `${API_BASE_URL}/Pages`;
  private readonly baseUrl = "/api";
  constructor(private http: HttpClient) { }

  list(): Observable<PageDto[]> {
    return this.http.get<PageDto[]>(this.baseUrl);
  }

  get(key: string) {
    return this.http.get<PageDto>(`${this.baseUrl}/${encodeURIComponent(key)}`);
  }

  update(key: string, body: { title: string; content: string }) {
    return this.http.put<void>(`${this.baseUrl}/${encodeURIComponent(key)}`, body);
  }
}
