import { Component, Inject, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/** A dialógusnak átadott adat */
export interface PhotoViewerData {
  photos: any[];
  index: number;   // kezdő index
  album?: any;
}

/* --- Képvariáns utilok (ImageVariantService névkonvenciójához) --- */
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
  // <guid32>_w320.webp / _w640 / _w1024 / _w1600
  const m = url.match(/^(.*\/)([0-9a-f]{32})(?:_(w(\d+)|orig))\.(webp|jpe?g|png)$/i);
  if (!m) return '';
  const base = m[1];
  const guid = m[2];
  const variants = [320, 640, 1024, 1600];
  return variants.map(w => `${base}${guid}_w${w}.webp ${w}w`).join(', ');
}

@Component({
  selector: 'app-photo-viewer-dialog',
  standalone: true,
  templateUrl: './photo-viewer-dialog.component.html',
  styles: [`
    :host { display:block; }
    .pv-wrap {
      position: relative; width: 100vw; height: 100vh;
      background: #000; color: #fff; overflow: hidden;
      display: grid; place-items: center;
    }
    .pv-img { max-width: 100vw; max-height: 100vh; object-fit: contain; }
    .pv-topbar {
      position: absolute; top: 0; left: 0; right: 0; height: 56px;
      display: flex; align-items: center; gap: 8px; padding: 8px 12px;
      background: linear-gradient(to bottom, rgba(0,0,0,.65), rgba(0,0,0,0));
    }
    .pv-spacer { flex: 1; }
    .pv-ctrl {
      position: absolute; top: 50%; transform: translateY(-50%);
      width: 56px; height: 56px; border-radius: 9999px;
      display: grid; place-items: center; background: rgba(0,0,0,.45);
      cursor: pointer; user-select: none;
    }
    .pv-ctrl:hover { background: rgba(0,0,0,.7); }
    .pv-prev { left: 12px; }
    .pv-next { right: 12px; }
    .pv-counter { font-size: 14px; opacity: .85; margin-left: 8px; }
  `],
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
})
export class PhotoViewerDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<PhotoViewerDialogComponent>);

  // Fontos: ne használjuk a 'data'-t mező-inicializáláskor!
  constructor(@Inject(MAT_DIALOG_DATA) public data: PhotoViewerData) { }

  photos: any[] = [];
  private _index = 0;

  ngOnInit(): void {
    this.photos = Array.isArray(this.data?.photos) ? this.data.photos : [];
    const max = Math.max(0, this.photos.length - 1);
    const start = Number.isFinite(this.data?.index) ? (this.data!.index as number) : 0;
    this._index = Math.min(Math.max(0, start), max);
    this.preloadNeighbors();
  }

  get index(): number { return this._index; }
  current(): any { return this.photos[this._index]; }
  title(): string { return this.current()?.title ?? this.data?.album?.title ?? 'Photo'; }

  photoUrl(p: any): string {
    const url = normalizeUploadUrl(p?.imageUrl || '');
    return url ? preferBestDefault(url) : '';
  }
  photoSrcset(p: any): string {
    const url = normalizeUploadUrl(p?.imageUrl || '');
    return url ? buildSrcsetFromVariant(url) : '';
  }

  next() {
    if (!this.photos.length) return;
    this._index = (this._index + 1) % this.photos.length;
    this.preloadNeighbors();
  }
  prev() {
    if (!this.photos.length) return;
    this._index = (this._index - 1 + this.photos.length) % this.photos.length;
    this.preloadNeighbors();
  }
  close() { this.dialogRef.close(); }

  /** Billentyűk: ← → Esc  */
  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') { e.preventDefault(); this.next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); this.prev(); }
    else if (e.key === 'Escape') { e.preventDefault(); this.close(); }
  }

  /** Elő-/utólagos preload a gördülékeny váltáshoz */
  private preloadNeighbors() {
    const prev = this.photos[this._index - 1];
    const next = this.photos[this._index + 1];
    for (const p of [prev, next]) {
      if (!p) continue;
      const img = new Image();
      img.src = this.photoUrl(p);
      const ss = this.photoSrcset(p);
      if (ss) (img as any).srcset = ss;
    }
  }
}
