import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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

export interface ReorderItem {
  id: number;
  parentId?: number | null;
  order: number;
}

@Injectable({ providedIn: 'root' })
export class MenuService {
  private http = inject(HttpClient);
  private base = '/api/Menu';

  getTree(): Observable<MenuNode[]> {
    return this.http.get<MenuNode[]>(`${this.base}/tree`).pipe(
      catchError(() => of([]))
    );
  }

  create(dto: CreateMenuItem): Observable<MenuNode> {
    return this.http.post<MenuNode>(this.base, dto);
  }

  update(id: number, dto: UpdateMenuItem): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  reorder(items: ReorderItem[]): Observable<void> {
    return this.http.post<void>(`${this.base}/reorder`, items);
  }
}
