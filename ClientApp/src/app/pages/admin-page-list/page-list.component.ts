import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PagesService, PageDto } from '../../services/page.service';

@Component({
  standalone: true,
  selector: 'app-admin-pages-list',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="wrap">
      <header>
        <h1>Oldalak (CMS)</h1>
        <a routerLink="/admin/pages/about">„about” szerkesztése</a>
      </header>

      <table class="grid">
        <thead>
          <tr>
            <th>Key</th>
            <th>Cím</th>
            <th>Utoljára frissítve</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of pages">
            <td><code>{{ p.key }}</code></td>
            <td>{{ p.title }}</td>
            <td>{{ p.updatedUtc | date:'yyyy.MM.dd HH:mm' }}</td>
            <td><a [routerLink]="['/admin/pages', p.key]">Szerkesztés</a></td>
          </tr>
        </tbody>
      </table>
    </section>
  `,
  styles: [`
    .wrap{max-width:1100px;margin:1rem auto;padding:0 1rem}
    header{display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem}
    table.grid{width:100%;border-collapse:collapse}
    table.grid th, table.grid td{border-bottom:1px solid #e6e6e6;padding:.5rem .4rem;text-align:left}
    code{background:#f4f4f4;padding:0 .25rem;border-radius:4px}
  `]
})
export class AdminPagesListComponent {
  private pagesSvc = inject(PagesService);
  pages: PageDto[] = [];
  constructor() {
    this.pagesSvc.list().subscribe(list => this.pages = list);
  }
}
