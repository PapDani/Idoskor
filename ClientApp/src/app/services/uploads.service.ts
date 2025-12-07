// src/app/core/uploads.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
//import { API_BASE_URL } from './api-config';

export interface ImageVariantsResponse {
  original?: string;
  w1024?: string;
  w640?: string;
  // ha a backend mást is visszaad, itt bővíthető
}

@Injectable({ providedIn: 'root' })
export class UploadsService {
  // MINDIG az /api/Uploads alatt hívjuk a backendet
  private readonly baseUrl = "/api";

  constructor(private http: HttpClient) { }

  // Régi, sima kép-feltöltés (ha még használod valahol)
  uploadImage(file: File): Observable<string | ImageVariantsResponse> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<string | ImageVariantsResponse>(
      `${this.baseUrl}/image`,
      form
    );
  }

  // Új: variánsok (w1024, w640, original, stb.)
  uploadImageVariants(file: File): Observable<ImageVariantsResponse> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ImageVariantsResponse>(
      `${this.baseUrl}/image-variants`,
      form
    );
  }
}
