import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { CardService, Card } from '../../services/card.service';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-cards',
  imports: [CommonModule, MatCardModule],
  templateUrl: './card-list.component.html',
  styleUrls: ['./card-list.component.scss']
})

export class CardsComponent {
  private cardsApi = inject(CardService);
  private router = inject(Router);

  cards: any[] = [];
  readonly placeholder = "data:image/svg+xml;utf8,\
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'>\
<rect width='16' height='9' fill='%23eee'/>\
<path d='M0 9L5 4l3 3 4-4 4 6H0z' fill='%23bbb'/>\
</svg>";

  ngOnInit(): void {
    this.cardsApi.list('desc', 'created').subscribe(list => {
      this.cards = this.sortCards(list); // biztos ami biztos
    });
  }

  private toTime(v: any): number {
    const t = new Date(v ?? 0).getTime();
    return isFinite(t) ? t : 0;
  }
  private sortCards(list: any[]): any[] {
    return [...(list ?? [])].sort((a, b) => {
      const ta = this.toTime(a?.createdUtc ?? a?.createdAt);
      const tb = this.toTime(b?.createdUtc ?? b?.createdAt);
      if (tb !== ta) return tb - ta;
      return (b?.id ?? 0) - (a?.id ?? 0);
    });
  }

  // kép helper + hiba
  resolveImage(url?: string | null): string {
    if (!url) return this.placeholder;
    if (/^(https?:|data:|blob:)/i.test(url)) return url;
    url = url.replace(/^~?\/?wwwroot\/?/i, '');
    if (!url.startsWith('/')) url = '/' + url;
    return url;
  }

  onImgError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    const ds = img.dataset; // DOMStringMap

    if (ds['fallbackApplied'] === '1') return; // <-- zárójeles elérés
    ds['fallbackApplied'] = '1';               // <-- zárójeles elérés

    // biztos ami biztos: ne hívódjon újra a (error), ha a placeholder is hibázna
    img.onerror = null;

    img.src = this.placeholder; // data: URI vagy assets-es svg/webp, ahogy beállítottad
  }

  // alcím/link megjelenítés
  subtitleOf(c: any): string {
    return (c?.contentUrl ?? c?.subtitle ?? c?.subTitle ?? c?.link ?? '').toString().trim();
  }
  isExternalLink(v?: string | null): boolean { return !!v && /^(https?:)?\/\//i.test(v); }
  onSubtitleLinkClick(ev: MouseEvent) { ev.stopPropagation(); }

  // navigáció
  goDetail(arg: any): void {
    if (arg && typeof arg === 'object') {
      const key = arg.pageKey ?? arg.page?.key ?? null;
      if (key) { this.router.navigate(['/pages', key]); return; }
      const id = arg.id ?? arg.cardId ?? null;
      if (id != null) { this.router.navigate(['/cards', id]); return; }
      return;
    }
    this.router.navigate(['/cards', arg]);
  }
}
