import { Component, OnInit, inject, AfterViewInit, Directive, ElementRef, HostBinding, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';

/* --- Lazy blur direktíva (cache-esetre is) --- */
@Directive({
  selector: 'img[lazyBlur]',
  standalone: true,
})
export class LazyBlurDirectiveList implements AfterViewInit {
  @HostBinding('class.is-loading') isLoading = true;
  constructor(private el: ElementRef<HTMLImageElement>) { }
  ngAfterViewInit() {
    const img = this.el.nativeElement;
    img.loading = 'lazy';
    img.decoding = 'async';
    if (img.complete && img.naturalWidth > 0) {
      img.decode?.().catch(() => { }).finally(() => this.markLoaded());
    }
  }
  @HostListener('load') onLoad() { this.markLoaded(); }
  @HostListener('error') onError() { this.markLoaded(); }
  private markLoaded() {
    this.isLoading = false;
    const img = this.el.nativeElement;
    img.classList.add('is-loaded');
    img.classList.remove('is-loading');
  }
}

/* --- Képvariáns utilok --- */
function normalizeUploadUrl(url?: string | null): string {
  if (!url) return '';
  let u = url.trim();
  u = u.replace(/^~?\/?wwwroot\/?/i, ''); // „wwwroot” törlése, ha benne maradt
  if (!u.startsWith('/')) u = '/' + u;
  return u;
}
function preferBestDefault(url: string): string {
  // Grid/kártya nézetben 1024 a jó default
  return url.replace(/_(orig|w\d+)\.(webp|jpe?g|png)$/i, '_w1024.webp');
}
function buildSrcsetFromVariant(url: string): string {
  // <guid>_w320.webp / _w640 / _w1024 / _w1600
  const m = url.match(/^(.*\/)([0-9a-f]{32})(?:_(w(\d+)|orig))\.(webp|jpe?g|png)$/i);
  if (!m) return '';
  const base = m[1];
  const guid = m[2];
  const variants = [320, 640, 1024, 1600];
  return variants.map(w => `${base}${guid}_w${w}.webp ${w}w`).join(', ');
}

@Component({
  selector: 'app-album-list',
  standalone: true,
  templateUrl: './album-list.component.html',
  // kis stílus a blur effekt eltüntetéséhez
  styles: [`
    img[lazyBlur] {
      filter: blur(12px);
      transform: scale(1.02);
      opacity: .85;
      transition: filter .25s ease, transform .25s ease, opacity .25s ease;
    }
    img[lazyBlur].is-loaded {
      filter: none;
      transform: none;
      opacity: 1;
    }
    .album-card { cursor: pointer; }
    .album-card mat-card-header { padding: 12px 16px 16px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 16px; }
  `],
  imports: [CommonModule, RouterModule, MatCardModule, LazyBlurDirectiveList],
})
export class AlbumListComponent implements OnInit {
  private http = inject(HttpClient);

  albums: any[] = [];
  loading = true;
  placeholder = 'assets/img/placeholder-photo.webp';

  ngOnInit(): void {
    // ANY-t kérünk vissza, hogy rugalmasan kezeljük a választ
    this.http.get<any>('/api/Albums').subscribe({
      next: res => {
        const arr = Array.isArray(res) ? res : (res?.items ?? res?.albums ?? res?.data ?? []);
        this.albums = Array.isArray(arr) ? arr : [];
        this.loading = false;
      },
      error: () => { this.albums = []; this.loading = false; }
    });
  }

  coverUrl(a: any): string {
    const raw = a?.coverUrl || a?.cover?.imageUrl || a?.coverImageUrl || '';
    const url = normalizeUploadUrl(raw);
    return url ? preferBestDefault(url) : this.placeholder;
  }

  coverSrcset(a: any): string {
    const raw = a?.coverUrl || a?.cover?.imageUrl || a?.coverImageUrl || '';
    const url = normalizeUploadUrl(raw);
    return url ? buildSrcsetFromVariant(url) : '';
  }
}
