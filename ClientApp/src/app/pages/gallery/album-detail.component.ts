import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { GalleryService, AlbumDetail } from '../../services/gallery.service';
import { LazyImageDirective } from '../../directives/lazy-image.directive';
import { PhotoViewerDialogComponent } from './photo-viewer-dialog.component';

@Component({
  standalone: true,
  selector: 'app-album-detail',
  imports: [CommonModule, RouterLink, MatDialogModule, LazyImageDirective],
  template: `
  <section class="wrap" *ngIf="album">
    <div class="head">
      <h1>{{ album.title }}</h1>
      <a routerLink="/gallery">← Vissza a galériához</a>
    </div>
    <p *ngIf="album.description" class="desc">{{ album.description }}</p>

    <div class="masonry" *ngIf="album.photos?.length; else none">
      <figure class="item" *ngFor="let p of album.photos; let i = index" (click)="openViewer(i)">
        <img
          [attr.srcset]="srcsetFor(p.imageUrl) || null"
          [attr.sizes]="srcsetFor(p.imageUrl) ? sizesAttr : null"
          [appLazyImage]="p.imageUrl"
          [alt]="p.title || album.title">
        <figcaption *ngIf="p.title">{{ p.title }}</figcaption>
      </figure>
    </div>
    <ng-template #none><p class="muted">Ebben az albumban még nincsenek képek.</p></ng-template>
  </section>
  `,
  styles: [`
    .wrap{max-width:1100px;margin:1rem auto;padding:0 1rem}
    .head{display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem}
    .desc{color:#444;margin:.25rem 0 1rem}
    .masonry{column-count:4;column-gap:12px}
    @media (max-width: 1200px){ .masonry{column-count:3} }
    @media (max-width: 900px){ .masonry{column-count:2} }
    @media (max-width: 600px){ .masonry{column-count:1} }
    .item{break-inside:avoid;margin:0 0 12px;cursor:zoom-in}
    .item img{width:100%;border-radius:8px;display:block}
    .item figcaption{font-size:.9rem;color:#555;margin-top:.25rem}

    /* Lazy blur-in */
    img.lazy-img{filter:blur(12px);opacity:.6;transition:filter .4s ease, opacity .4s ease}
    img.loaded{filter:blur(0);opacity:1}
    .muted{color:#767676}
  `]
})
export class AlbumDetailComponent {
  private route = inject(ActivatedRoute);
  private api = inject(GalleryService);
  private dialog = inject(MatDialog);

  album?: AlbumDetail;

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.api.getBySlug(slug).subscribe(a => this.album = a);
  }

  openViewer(index: number) {
    if (!this.album?.photos?.length) return;
    this.dialog.open(PhotoViewerDialogComponent, {
      panelClass: 'lightbox-panel',
      data: { photos: this.album.photos, index, albumTitle: this.album.title },
      maxWidth: '100vw',
      width: '100vw',
      height: '100vh',
      autoFocus: false
    });
  }

  srcsetFor(url: string): string | null {
    // Ha a fájlnév végén _wNNN.webp mintát találunk, generálunk más variánsokat is
    const m = url.match(/_w(\d+)\.(webp|jpe?g|png)$/i);
    if (!m) return null;

    const base = url.replace(/_w\d+\.(webp|jpe?g|png)$/i, '');
    const ext = url.endsWith('.webp') ? 'webp' : 'webp'; // kényszerítjük webpre
    const make = (w: number) => `${base}_w${w}.${ext}`;

    const set = [
      `\${make(320)} 320w`,
      `\${make(640)} 640w`,
      `\${make(1024)} 1024w`,
      `\${make(1600)} 1600w`
    ];
    return set.join(', ');
  }

  sizesAttr = '(min-width: 1200px) 25vw, (min-width: 900px) 33vw, (min-width: 600px) 50vw, 100vw';

}
