import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GalleryService, AlbumListItem } from '../../services/gallery.service';
import { LazyImageDirective } from '../../directives/lazy-image.directive';

@Component({
  standalone: true,
  selector: 'app-album-list',
  imports: [CommonModule, RouterLink, LazyImageDirective],
  template: `
  <section class="wrap">
    <h1>Galéria</h1>
    <div class="grid">
      <a class="album-card" *ngFor="let a of albums" [routerLink]="['/gallery', a.slug]">
        <div class="thumb">
          <img *ngIf="a.coverImageUrl" [appLazyImage]="a.coverImageUrl!" [alt]="a.title">
          <div class="overlay"></div>
          <span class="badge" aria-label="Képek száma">{{ a.photoCount }}</span>
        </div>
        <h3 class="title">{{ a.title }}</h3>
      </a>
    </div>
  </section>
  `,
  styles: [`
    .wrap{max-width:1100px;margin:1rem auto;padding:0 1rem}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}
    .album-card{display:block;color:inherit;text-decoration:none}
    .thumb{position:relative;aspect-ratio:4/3;border-radius:12px;overflow:hidden;background:linear-gradient(135deg,#ececec,#f6f6f6)}
    .thumb img{width:100%;height:100%;object-fit:cover;transform:scale(1.02);transition:transform .3s ease, filter .3s ease;filter:saturate(.9)}
    .album-card:hover .thumb img{transform:scale(1.06);filter:saturate(1)}
    .overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.35),transparent 55%);pointer-events:none}
    .badge{position:absolute;right:10px;bottom:10px;background:rgba(0,0,0,.65);color:#fff;border-radius:999px;padding:.2rem .55rem;font-size:.85rem}
    .title{margin:.5rem .25rem 0;font-weight:600}

    /* Lazy blur-in */
    img.lazy-img{filter:blur(12px);opacity:.6;transition:filter .4s ease, opacity .4s ease}
    img.loaded{filter:blur(0);opacity:1}
  `]
})
export class AlbumListComponent {
  private api = inject(GalleryService);
  albums: AlbumListItem[] = [];
  ngOnInit() { this.api.listPublic().subscribe(list => this.albums = list); }
}
