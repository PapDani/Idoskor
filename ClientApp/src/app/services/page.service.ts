import { Injectable } from '@angular/core';
import { PagesService, type PageDto, type UpsertPageDto } from '../api';
import { Observable } from 'rxjs';

  @Injectable({ providedIn: 'root' })
  export class PageService {
  constructor(private api: PagesService) { }
  list(): Observable < PageDto[] > { return this.api.apiPagesGet(); }
   get(key: string): Observable < PageDto > { return this.api.apiPagesKeyGet(key); }
     save(key: string, title: string, content: string) {
      const body: UpsertPageDto = { title, content };
      return this.api.apiPagesKeyPut(key, body);
    }
}
