import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { GalleryService, AlbumListItem, AlbumDetail, Photo } from '../../services/gallery.service';
import { UploadsService } from '../../services/uploads.service';
import { slugify } from '../../utils/slugify';

@Component({
  standalone: true,
  selector: 'app-admin-gallery',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,              // <-- HOZZÁADVA
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatSnackBarModule,
    DragDropModule
  ],
  template: `
  <section class="wrap">
    <header class="head">
      <h1>Galéria – admin</h1>
    </header>

    <div class="layout">
      <!-- Albumböngésző -->
      <aside class="albums">
        <h3>Albumok</h3>
        <div cdkDropList (cdkDropListDropped)="reorderAlbums($event)">
          <div class="album-row" *ngFor="let a of albums; index as i" cdkDrag (click)="selectAlbum(a)" [class.active]="a.id === selected?.id">
            <span class="drag">::</span>
            <div class="title">{{ a.title }}</div>
            <div class="count">{{ a.photoCount }} kép</div>
          </div>
        </div>

        <form [formGroup]="albumForm" class="new-album" (ngSubmit)="createAlbum()">
          <h4>Új album</h4>
          <mat-form-field appearance="outline">
            <mat-label>Cím</mat-label>
            <input matInput formControlName="title" (input)="syncSlug()">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Slug</mat-label>
            <input matInput formControlName="slug">
          </mat-form-field>
          <button mat-raised-button color="primary" type="submit" [disabled]="albumForm.invalid">Létrehozás</button>
        </form>
      </aside>

      <!-- Album részletek -->
      <main class="details" *ngIf="selectedDetail">
        <div class="row">
          <mat-form-field appearance="outline" class="grow">
            <mat-label>Cím</mat-label>
            <input matInput [(ngModel)]="selectedDetail.title" [ngModelOptions]="{standalone: true}">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Slug</mat-label>
            <input matInput [(ngModel)]="selectedDetail.slug" [ngModelOptions]="{standalone: true}">
          </mat-form-field>
          <mat-slide-toggle [(ngModel)]="selectedDetail.isPublished" [ngModelOptions]="{standalone: true}">Publikált</mat-slide-toggle>
          <button mat-raised-button color="primary" (click)="saveAlbum()">Mentés</button>
          <button mat-stroked-button color="warn" (click)="deleteAlbum()">Törlés</button>
        </div>

        <mat-form-field appearance="outline" class="desc">
          <mat-label>Leírás</mat-label>
          <textarea matInput rows="3" [(ngModel)]="selectedDetail.description" [ngModelOptions]="{standalone: true}"></textarea>
        </mat-form-field>

        <div class="upload">
          <input type="file" multiple (change)="onFiles($event)" />
          <!-- NG8107 jav.: itt már biztos van selectedDetail, és photos nem null -->
          <button mat-stroked-button (click)="setFirstAsCover()" [disabled]="!selectedDetail.photos.length">Első kép legyen borító</button>
        </div>

        <div class="photos" cdkDropList (cdkDropListDropped)="reorderPhotos($event)">
          <div class="photo" *ngFor="let p of selectedDetail.photos; index as i" cdkDrag>
            <img [src]="p.imageUrl" [alt]="p.title || selectedDetail.title">
            <input class="ptitle" [value]="p.title || ''" (change)="renamePhoto(p, $any($event.target).value)" placeholder="Cím (opcionális)">
            <div class="actions">
              <button mat-button (click)="makeCover(p)">Borító</button>
              <button mat-button color="warn" (click)="deletePhoto(p)">Törlés</button>
            </div>
          </div>
        </div>
      </main>

      <main class="details" *ngIf="!selectedDetail">
        <p class="muted">Válassz albumot vagy hozz létre egy újat.</p>
      </main>
    </div>
  </section>
  `,
  styles: [`
    .wrap{max-width:1200px;margin:1rem auto;padding:0 1rem}
    .layout{display:grid;grid-template-columns:320px 1fr;gap:1rem}
    .albums{border:1px solid #eee;border-radius:8px;padding:.5rem}
    .album-row{display:flex;align-items:center;gap:.5rem;padding:.35rem;border:1px solid #f0f0f0;border-radius:6px;margin-bottom:.35rem;cursor:pointer}
    .album-row.active{background:#eef5ff;border-color:#cfe0ff}
    .album-row .drag{cursor:grab;color:#666}
    .album-row .title{flex:1}
    .album-row .count{color:#777;font-size:.9rem}
    .new-album{margin-top:.75rem;display:grid;gap:.5rem}
    .details{border:1px solid #eee;border-radius:8px;padding:.75rem}
    .row{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap}
    .row .grow{flex:1}
    .desc{display:block;margin:.5rem 0}
    .upload{display:flex;gap:.5rem;align-items:center;margin-bottom:.5rem}
    .photos{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:.5rem}
    .photo{border:1px solid #eee;border-radius:6px;padding:.5rem;display:flex;flex-direction:column;gap:.4rem}
    .photo img{width:100%;height:120px;object-fit:cover;border-radius:4px}
    .photo .ptitle{border:1px solid #ddd;border-radius:6px;padding:.35rem}
    .actions{display:flex;gap:.25rem;justify-content:space-between}
    .muted{color:#777}
    @media (max-width: 1024px){ .layout{grid-template-columns:1fr} }
  `]
})
export class AdminGalleryComponent {
  private gallery = inject(GalleryService);
  private upload = inject(UploadsService);
  private fb = inject(NonNullableFormBuilder);
  private snack = inject(MatSnackBar);

  albums: AlbumListItem[] = [];
  selected: AlbumListItem | null = null;
  selectedDetail: AlbumDetail | null = null;
  saving = signal(false);

  albumForm = this.fb.group({
    title: this.fb.control('', { validators: [Validators.required] }),
    slug: this.fb.control('', { validators: [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)] })
  });

  ngOnInit() { this.loadAlbums(); }

  private loadAlbums() {
    this.gallery.listAdmin().subscribe(list => {
      this.albums = list;
      if (this.selected) {
        const s = list.find(x => x.id === this.selected!.id);
        if (!s) { this.selected = null; this.selectedDetail = null; }
      }
    });
  }

  selectAlbum(a: AlbumListItem) {
    this.selected = a;
    this.gallery.getBySlug(a.slug).subscribe(detail => this.selectedDetail = detail);
  }

  syncSlug() {
    const t = this.albumForm.controls.title.value || '';
    if (!this.albumForm.controls.slug.dirty) {
      this.albumForm.controls.slug.setValue(slugify(t));
      this.albumForm.controls.slug.markAsPristine();
    }
  }

  createAlbum() {
    const { title, slug } = this.albumForm.getRawValue();
    if (!title || !slug) return;
    this.gallery.createAlbum({ title, slug }).subscribe({
      next: a => {
        this.snack.open('Album létrehozva ✅', undefined, { duration: 1500 });
        this.albumForm.reset();
        this.loadAlbums();
        this.selectAlbum(a);
      },
      error: err => this.snack.open((err?.error || 'Hiba a létrehozáskor ❌'), undefined, { duration: 2500 })
    });
  }

  saveAlbum() {
    if (!this.selectedDetail) return;
    const d = this.selectedDetail;
    this.gallery.updateAlbum(d.id, { title: d.title, slug: d.slug, description: d.description ?? null, isPublished: d.isPublished })
      .subscribe({
        next: () => { this.snack.open('Album mentve ✅', undefined, { duration: 1500 }); this.loadAlbums(); },
        error: () => this.snack.open('Mentés sikertelen ❌', undefined, { duration: 2500 })
      });
  }

  deleteAlbum() {
    if (!this.selectedDetail) return;
    if (!confirm('Biztosan törlöd az albumot? A képei is törlődnek.')) return;
    this.gallery.deleteAlbum(this.selectedDetail.id).subscribe({
      next: () => { this.snack.open('Album törölve ✅', undefined, { duration: 1500 }); this.selected = null; this.selectedDetail = null; this.loadAlbums(); },
      error: () => this.snack.open('Törlés sikertelen ❌', undefined, { duration: 2500 })
    });
  }

  reorderAlbums(event: CdkDragDrop<AlbumListItem[]>) {
    moveItemInArray(this.albums, event.previousIndex, event.currentIndex);
    const payload = this.albums.map((a, idx) => ({ id: a.id, order: idx }));
    this.gallery.reorderAlbums(payload).subscribe(() => this.loadAlbums());
  }

  onFiles(ev: Event) {
    if (!this.selectedDetail) return;
    const files = (ev.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;

    const tasks: Promise<{ imageUrl: string }>[] = Array.from(files).map(f =>
      new Promise<{ imageUrl: string }>(resolve => {
        this.upload.uploadImage(f).subscribe((url: string) => resolve({ imageUrl: url }));
      })
    );

    Promise.all(tasks).then(items => {
      this.gallery.addPhotos(this.selectedDetail!.id, items).subscribe({
        next: () => {
          this.snack.open('Képek hozzáadva ✅', undefined, { duration: 1500 });
          this.selectAlbum(this.albums.find(a => a.id === this.selectedDetail!.id)!);
        },
        error: () => this.snack.open('Feltöltés sikertelen ❌', undefined, { duration: 2500 })
      });
    });
  }

  reorderPhotos(event: CdkDragDrop<Photo[]>) {
    if (!this.selectedDetail) return;
    moveItemInArray(this.selectedDetail.photos, event.previousIndex, event.currentIndex);
    const payload = this.selectedDetail.photos.map((p, idx) => ({ id: p.id, order: idx }));
    this.gallery.reorderPhotos(this.selectedDetail.id, payload).subscribe(() => {
      // ok
    });
  }

  renamePhoto(p: Photo, title: string) {
    this.gallery.updatePhoto(p.id, { title, description: p.description ?? null, isVisible: p.isVisible }).subscribe({
      next: () => this.snack.open('Cím frissítve ✅', undefined, { duration: 1200 })
    });
  }

  deletePhoto(p: Photo) {
    if (!confirm('Biztosan törlöd a képet?')) return;
    this.gallery.deletePhoto(p.id).subscribe({
      next: () => {
        this.snack.open('Kép törölve ✅', undefined, { duration: 1200 });
        if (!this.selectedDetail) return;
        this.selectedDetail.photos = this.selectedDetail.photos.filter(x => x.id !== p.id);
      }
    });
  }

  makeCover(p: Photo) {
    if (!this.selectedDetail) return;
    this.gallery.setCover(this.selectedDetail.id, p.id).subscribe({
      next: () => { this.snack.open('Borítókép beállítva ✅', undefined, { duration: 1200 }); this.loadAlbums(); }
    });
  }

  setFirstAsCover() {
    if (!this.selectedDetail?.photos?.length) return;
    this.makeCover(this.selectedDetail.photos[0]);
  }
}
