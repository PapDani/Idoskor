import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Card {
  id: number;
  title: string;
  imageUrl?: string | null;
  contentUrl?: string | null;
  pageKey?: string | null;
  createdUtc?: string;
}

export interface UpsertCardDto {
  title: string;
  imageUrl?: string | null;
  contentUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CardService {
  private http = inject(HttpClient);
  private base = '/api/Cards';

  // Lista (DESC a legújabb elöl)
  list(order: 'asc' | 'desc' = 'desc', sort: 'created' | 'manual' = 'created'): Observable<Card[]> {
    const params = new URLSearchParams();
    params.set('order', order);
    params.set('sort', sort);
    return this.http.get<Card[]>(`${this.base}?${params.toString()}`);
  }

  reorder(items: { id: number; order: number }[]): Observable<void> {
    return this.http.post<void>(`${this.base}/reorder`, items);
  }

  // Részlet
  get(id: number): Observable<Card> {
    return this.http.get<Card>(`${this.base}/${id}`);
  }

  // Létrehozás (JSON-t vár a backend; ha FormData-t kapunk, kigyűjtjük belőle a mezőket)
  create(body: UpsertCardDto | FormData): Observable<Card> {
    const dto = this.toUpsert(body);
    return this.http.post<Card>(this.base, dto);
  }

  // Módosítás
  update(id: number, body: UpsertCardDto | FormData): Observable<void> {
    const dto = this.toUpsert(body);
    return this.http.put<void>(`${this.base}/${id}`, dto);
  }

  // Törlés
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  // Kártyához cikk hozzárendelés / leválasztás
  setPage(id: number, pageKey: string | null): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/page`, { pageKey });
  }

  // --- VISSZAFELÉ KOMPATIBILIS ALIASOK ---

  getCard(id: number): Observable<Card> { return this.get(id); }
  createCard(body: UpsertCardDto | FormData): Observable<Card> { return this.create(body); }
  updateCard(id: number, body: UpsertCardDto | FormData): Observable<void> { return this.update(id, body); }
  deleteCard(id: number): Observable<void> { return this.delete(id); }

  // FormData -> UpsertCardDto
  private toUpsert(body: UpsertCardDto | FormData): UpsertCardDto {
    if (body instanceof FormData) {
      const title = (body.get('title') as string) ?? '';
      const imageUrl = (body.get('imageUrl') as string) ?? null;
      const contentUrl = (body.get('contentUrl') as string) ?? null;
      return { title, imageUrl, contentUrl };
    }
    return body;
  }
}
