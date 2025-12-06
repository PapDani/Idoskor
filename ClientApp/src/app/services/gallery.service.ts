import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';

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
  private readonly baseUrl = `${API_BASE_URL}/Albums`;

  constructor(private http: HttpClient) { }

  // publikus
  listPublic(): Observable<AlbumListItem[]> {
    return this.http.get<AlbumListItem[]>(this.baseUrl);
  }
  getBySlug(slug: string): Observable<AlbumDetail> {
    return this.http.get<AlbumDetail>(`${this.baseUrl}/${encodeURIComponent(slug)}`);
  }

  // admin
  listAdmin(): Observable<AlbumListItem[]> {
    return this.http.get<AlbumListItem[]>(`${this.baseUrl}/admin`);
  }
  createAlbum(body: { title: string; slug: string; description?: string | null }): Observable<AlbumListItem> {
    return this.http.post<AlbumListItem>(this.baseUrl, body);
  }
  updateAlbum(id: number, body: { title: string; slug: string; description?: string | null; isPublished: boolean }): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, body);
  }
  deleteAlbum(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
  reorderAlbums(items: { id: number; order: number }[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/reorder`, items);
  }
  setCover(id: number, photoId: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/cover`, { photoId });
  }
  addPhotos(albumId: number, photos: { imageUrl: string; title?: string | null; description?: string | null }[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${albumId}/photos`, { photos });
  }
  reorderPhotos(albumId: number, items: { id: number; order: number }[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${albumId}/photos/reorder`, items);
  }

  // photo update/delete
  updatePhoto(
    id: number,
    body: { title?: string | null; description?: string | null; isVisible: boolean }
  ): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, body);
  }

  deletePhoto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
