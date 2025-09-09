import { Component, HostListener, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Photo } from '../../services/gallery.service';

type Data = { photos: Photo[]; index: number; albumTitle: string };

@Component({
  standalone: true,
  selector: 'app-photo-viewer-dialog',
  imports: [CommonModule, MatDialogModule],
  template: `
  <div class="frame" (click)="close()">
    <div class="nav left" (click)="prev($event)" aria-label="Előző">‹</div>
    <div class="nav right" (click)="next($event)" aria-label="Következő">›</div>
    <button class="close" (click)="close($event)" aria-label="Bezárás">×</button>

    <div class="inner" (click)="$event.stopPropagation()">
      <img [src]="displayUrl" [alt]="current.title || data.albumTitle" class="photo">
      <div class="bar">
        <div class="title">{{ current.title || data.albumTitle }}</div>
        <div class="index">{{ i+1 }} / {{ data.photos.length }}</div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .frame{position:fixed;inset:0;background:rgba(0,0,0,.92);display:grid;place-items:center}
    .inner{position:relative;max-width:95vw;max-height:88vh;display:flex;flex-direction:column;gap:.5rem}
    .photo{max-width:95vw;max-height:80vh;object-fit:contain;border-radius:8px;box-shadow:0 10px 35px rgba(0,0,0,.45)}
    .bar{display:flex;justify-content:space-between;color:#fff;opacity:.9}
    .title{font-weight:600}
    .index{font-variant-numeric:tabular-nums}
    .nav{position:fixed;top:50%;transform:translateY(-50%);font-size:48px;line-height:1;color:#fff;opacity:.8;cursor:pointer;user-select:none;padding:.25rem .5rem}
    .nav:hover{opacity:1}
    .nav.left{left:20px}
    .nav.right{right:20px}
    .close{position:fixed;top:16px;right:16px;font-size:28px;line-height:1;background:transparent;border:0;color:#fff;cursor:pointer;opacity:.8}
    .close:hover{opacity:1}
    @media (max-width: 600px){
      .nav{font-size:36px}
      .close{font-size:24px}
    }
  `]
})
export class PhotoViewerDialogComponent {
  i: number;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Data,
    private ref: MatDialogRef<PhotoViewerDialogComponent>
  ) {
    this.i = Math.min(Math.max(0, data.index ?? 0), data.photos.length - 1);
  }

  get current(): Photo {
    return this.data.photos[this.i];
  }
  get displayUrl(): string {
    const url = this.current.imageUrl;
    // ha van w1600 a mintának megfelelően, azt használjuk a lightboxban
    const m = url.match(/_w(\d+)\.(webp|jpe?g|png)$/i);
    if (m) {
      return url.replace(/_w\d+\.(webp|jpe?g|png)$/i, '_w1600.webp');
    }
    return url;
  }

  next(ev?: Event) { ev?.stopPropagation(); this.i = (this.i + 1) % this.data.photos.length; this.preloadNeighbor(); }
  prev(ev?: Event) { ev?.stopPropagation(); this.i = (this.i - 1 + this.data.photos.length) % this.data.photos.length; this.preloadNeighbor(); }
  close(ev?: Event) { ev?.stopPropagation(); this.ref.close(); }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') this.close();
    if (e.key === 'ArrowRight') this.next();
    if (e.key === 'ArrowLeft') this.prev();
  }

  private preloadNeighbor() {
    const nextIdx = (this.i + 1) % this.data.photos.length;
    const prevIdx = (this.i - 1 + this.data.photos.length) % this.data.photos.length;
    [nextIdx, prevIdx].forEach(idx => {
      const url = this.data.photos[idx].imageUrl;
      const img = new Image(); img.src = url;
    });
  }
}
