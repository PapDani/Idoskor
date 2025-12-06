import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { API_BASE_URL } from '../api.config';

export interface MenuNode {
  id: number;
  label: string;
  slug?: string | null;
  isEnabled: boolean;
  parentId: number | null;
  order: number;
  pageId?: number | null;
  pageKey?: string | null;
  children: MenuNode[];
}

export interface CreateMenuItem {
  label: string;
  slug?: string | null;
  parentId?: number | null;
  order: number;
  isEnabled: boolean;
  pageKey?: string | null;
}
export interface UpdateMenuItem extends CreateMenuItem { }
export interface ReorderItem { id: number; parentId?: number | null; order: number; }

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly baseUrl = `${API_BASE_URL}/Menu`;
  constructor(private http: HttpClient) { }

  private _tree$ = new BehaviorSubject<MenuNode[]>([]);
  /** Erre iratkoznak fel a komponensek (fejléc is). */
  tree$ = this._tree$.asObservable();

  /** Betölti az API-ról és közzéteszi a fa állapotát. */
  load(): void {
    this.http.get<MenuNode[]>(`${this.baseUrl}/tree`).pipe(
      catchError(() => of([])),
      tap(tree => this._tree$.next(tree ?? []))
    ).subscribe();
  }

  /** Az aktuális fa pillanatfelvétele. */
  get snapshot(): MenuNode[] { return this._tree$.value; }

  create(dto: CreateMenuItem): Observable<MenuNode> {
    return this.http.post<MenuNode>(this.baseUrl, dto).pipe(
      tap(() => this.load())
    );
  }
  update(id: number, dto: UpdateMenuItem): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, dto).pipe(
      tap(() => this.load())
    );
  }
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.load())
    );
  }
  reorder(items: ReorderItem[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/reorder`, items).pipe(
      tap(() => this.load())
    );
  }
}
