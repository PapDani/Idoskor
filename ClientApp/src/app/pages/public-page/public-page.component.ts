import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PagesService, PageDto } from '../../services/page.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { map, switchMap, catchError, of, Observable } from 'rxjs';
import { RouterLink } from '@angular/router';

type ViewModel = { title: string; html: SafeHtml };

@Component({
  standalone: true,
  selector: 'app-public-page',
  imports: [CommonModule, RouterLink],
  template: `
  <button mat-stroked-button routerLink="/cards" class="back-to-cards">← Vissza a hírekhez</button>
    <ng-container *ngIf="vm$ | async as vm; else notFound">
      <h1 class="page-title">{{ vm.title }}</h1>
      <article class="page-content" [innerHTML]="vm.html"></article>
    </ng-container>
    <ng-template #notFound>
      <h1 class="page-title">Az oldal nem található</h1>
      <p>Lehet, hogy még nem készült el.</p>
    </ng-template>
  `,
  styles: [`
    .page-title { margin: 1rem auto .5rem; max-width: 900px; font-size: 2rem; font-weight: 700; }
    .page-content { max-width: 900px; margin: 0 auto 3rem; line-height: 1.6; }
    .page-content img { max-width: 100%; height: auto; }
  `]
})
export class PublicPageComponent {
  private route = inject(ActivatedRoute);
  private pages = inject(PagesService);
  private sanitizer = inject(DomSanitizer);

  vm$: Observable<ViewModel | null> = this.route.paramMap.pipe(
    map(pm => pm.get('key') ?? 'about'),
    switchMap(key =>
      this.pages.get(key).pipe(
        map((p: PageDto) => ({
          title: p.title ?? '',
          html: this.sanitizer.bypassSecurityTrustHtml(p.content ?? '')
        })),
        catchError(err => {
          if (err?.status === 404) return of(null);
          throw err;
        })
      )
    )
  );
}
