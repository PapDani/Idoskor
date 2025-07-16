import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Card } from '../api';

@Injectable({ providedIn: 'root' })
export class CardService {
  private readonly base = '/api/Cards';

  constructor(private http: HttpClient) { }

  createCard(formData: FormData): Observable<Card> {
    return this.http.post<Card>(this.base, formData);
  }

  updateCard(id: number, formData: FormData): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, formData);
  }

  deleteCard(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  getCards(): Observable<Card[]> {
    return this.http.get<Card[]>(this.base);
  }

  getCard(id: number): Observable<Card> {
    return this.http.get<Card>(`${this.base}/${id}`);
  }
}
