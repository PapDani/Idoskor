import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AlbumListItem {
  id: number;
  title: string;
  slug: string;
  coverImageUrl?: string | null;
  isPublished: boolean;
  photoCount: number;
  order: number;
}

export interface Photo {
  id: number;
  imageUrl: string;
  title?: string | null;
  description?: string | null;
  isVisible: boolean;
  order: number;
  createdUtc: string;
}

export interface AlbumDetail {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  coverImageUrl?: string | null;
  isPublished: boolean;
  order: number;
  createdUtc: string;
  photos: Photo[];
}

@Injectable({ providedIn: 'root' })
export class GalleryService {
  private http = inject(HttpClient);
  private base = '/api/Albums';

  // publikus
  listPublic(): Observable<AlbumListItem[]> {
    return this.http.get<AlbumListItem[]>(this.base);
  }
  getBySlug(slug: string): Observable<AlbumDetail> {
    return this.http.get<AlbumDetail>(`${this.base}/${encodeURIComponent(slug)}`);
  }

  // admin
  listAdmin(): Observable<AlbumListItem[]> {
    return this.http.get<AlbumListItem[]>(`${this.base}/admin`);
  }
  createAlbum(body: { title: string; slug: string; description?: string | null }): Observable<AlbumListItem> {
    return this.http.post<AlbumListItem>(this.base, body);
  }
  updateAlbum(id: number, body: { title: string; slug: string; description?: string | null; isPublished: boolean }): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, body);
  }
  deleteAlbum(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
  reorderAlbums(items: { id: number; order: number }[]): Observable<void> {
    return this.http.post<void>(`${this.base}/reorder`, items);
  }
  setCover(id: number, photoId: number): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/cover`, { photoId });
  }
  addPhotos(albumId: number, photos: { imageUrl: string; title?: string | null; description?: string | null }[]): Observable<void> {
    return this.http.post<void>(`${this.base}/${albumId}/photos`, { photos });
  }
  reorderPhotos(albumId: number, items: { id: number; order: number }[]): Observable<void> {
    return this.http.post<void>(`${this.base}/${albumId}/photos/reorder`, items);
  }

  // photo update/delete
  updatePhoto(id: number, body: { title?: string | null; description?: string | null; isVisible: boolean }): Observable<void> {
    return this.http.put<void>(`/api/Photos/${id}`, body);
  }
  deletePhoto(id: number): Observable<void> {
    return this.http.delete<void>(`/api/Photos/${id}`);
  }
}
