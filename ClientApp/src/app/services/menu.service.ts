import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface MenuNode {
  id: number;
  label: string;
  slug?: string;
  isEnabled: boolean;
  parentId: number | null;
  order: number;
  pageId?: number | null;
  pageKey?: string | null;
  children: MenuNode[];
}

@Injectable({ providedIn: 'root' })
export class MenuService {
  private http = inject(HttpClient);
  private base = '/api/Menu';

  getTree(): Observable<MenuNode[]> {
    return this.http.get<MenuNode[]>(`${this.base}/tree`).pipe(
      catchError(() => of(this.fallbackTree))
    );
  }

  // ÁTMENETI fallback, amíg nincs backend:
  private fallbackTree: MenuNode[] = [
    {
      id: 1,
      label: 'Üdvözöljük!',
      slug: 'welcome',
      isEnabled: true,
      parentId: null,
      order: 0,
      children: [
        {
          id: 2,
          label: 'Rólunk: Rövid bemutatkozás',
          slug: 'rolunk-bemutatkozas',
          isEnabled: true,
          parentId: 1,
          order: 0,
          pageKey: 'about',
          children: []
        },
        {
          id: 3,
          label: 'Céljaink • Küldetés és értékek',
          slug: 'celjaink',
          isEnabled: false,
          parentId: 1,
          order: 1,
          children: []
        }
      ]
    },
    {
      id: 10,
      label: 'Gerontológia Munkabizottság',
      slug: 'gero',
      isEnabled: false,
      parentId: null,
      order: 1,
      children: []
    },
    {
      id: 20,
      label: 'PEME KM Regionális Tagozata',
      slug: 'peme',
      isEnabled: false,
      parentId: null,
      order: 2,
      children: []
    },
    {
      id: 30,
      label: 'Aktív idősödés',
      slug: 'active-ageing',
      isEnabled: false,
      parentId: null,
      order: 3,
      children: []
    },
    {
      id: 40,
      label: 'Tudomány és kutatás',
      slug: 'science',
      isEnabled: false,
      parentId: null,
      order: 4,
      children: []
    },
    {
      id: 50,
      label: 'Programok és események',
      slug: 'events',
      isEnabled: false,
      parentId: null,
      order: 5,
      children: []
    },
    {
      id: 60,
      label: 'Személyes történetek',
      slug: 'stories',
      isEnabled: false,
      parentId: null,
      order: 6,
      children: []
    }
  ];
}
