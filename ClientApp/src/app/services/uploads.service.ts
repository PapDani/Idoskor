import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../api.config';

export interface ImageVariants {
  original: string;
  w320: string;
  w640: string;
  w1024: string;
  w1600?: string | null;
}

@Injectable({ providedIn: 'root' })
export class UploadsService {
  private readonly baseUrl = `${API_BASE_URL}/Uploads`;
  constructor(private http: HttpClient) { }

  // Meglévő – visszafelé kompatibilis
  uploadImage(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post(`${this.baseUrl}/image`, form);
  }

  uploadImageVariants(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post(`${this.baseUrl}/image-variants`, form);
  }
}
