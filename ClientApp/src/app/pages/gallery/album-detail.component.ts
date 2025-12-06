import { Component, OnInit, inject, AfterViewInit, Directive, ElementRef, HostBinding, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PhotoViewerDialogComponent } from './photo-viewer-dialog.component';

/* --- Lazy blur direktíva --- */
@Directive({
  selector: 'img[lazyBlur]',
  standalone: true,
})
export class LazyBlurDirectiveDetail implements AfterViewInit {
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
  u = u.replace(/^~?\/?wwwroot\/?/i, '');
  if (!u.startsWith('/')) u = '/' + u;
  return u;
}
function preferBestDefault(url: string): string {
  return url.replace(/_(orig|w\d+)\.(webp|jpe?g|png)$/i, '_w1024.webp');
}
function buildSrcsetFromVariant(url: string): string {
  const m = url.match(/^(.*\/)([0-9a-f]{32})(?:_(w(\d+)|orig))\.(webp|jpe?g|png)$/i);
  if (!m) return '';
  const base = m[1];
  const guid = m[2];
  const variants = [320, 640, 1024, 1600];
  return variants.map(w => `${base}${guid}_w${w}.webp ${w}w`).join(', ');
}

@Component({
  selector: 'app-album-detail',
  standalone: true,
  templateUrl: './album-detail.component.html',
  styles: [`
    .topbar {
      display: flex; align-items: center; gap: 8px;
      margin: 8px 0 16px;
    }
    .topbar .spacer { flex: 1; }

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
    .masonry { column-width: 320px; column-gap: 12px; width: 100%; }
    .item { break-inside: avoid; margin: 0 0 12px; }
    .item img { width: 100%; display: block; border-radius: 8px; cursor: zoom-in; }
  `],
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    LazyBlurDirectiveDetail
  ],
})
export class AlbumDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  album: any = null;
  photos: any[] = [];
  loading = true;
  placeholder = 'assets/img/placeholder-photo.webp';

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) { this.loading = false; return; }

    this.http.get<any>(`https://idoskor.onrender.com/api/Albums/${encodeURIComponent(slug)}`).subscribe({
      next: res => {
        this.album = res?.album ?? res;
        const arr = res?.photos ?? res?.items ?? res?.images ?? [];
        this.photos = Array.isArray(arr) ? arr : [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  /** 1) Vissza gomb működése */
  goBack(): void {
    // Ha van böngészői előzmény, ugrunk vissza; ha nincs (pl. deep link), megyünk a galériába.
    if (window.history.length > 1) window.history.back();
    else this.router.navigate(['/gallery']);
  }

  photoUrl(p: any): string {
    const url = normalizeUploadUrl(p?.imageUrl || '');
    return url ? preferBestDefault(url) : this.placeholder;
  }
  photoSrcset(p: any): string {
    const url = normalizeUploadUrl(p?.imageUrl || '');
    return url ? buildSrcsetFromVariant(url) : '';
  }

  openLightbox(p: any) {
    const idx = Math.max(0, this.photos.findIndex(x => x === p || x?.id === p?.id));
    this.dialog.open(PhotoViewerDialogComponent, {
      data: { photos: this.photos, index: idx, album: this.album },
      panelClass: 'photo-viewer-dialog',
      maxWidth: '100vw',
      width: '100vw',
      height: '100vh',
      autoFocus: false,
      restoreFocus: false,
      closeOnNavigation: true
    });
  }
}
