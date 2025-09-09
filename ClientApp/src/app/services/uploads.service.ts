import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface ImageVariants {
  original: string;
  w320: string;
  w640: string;
  w1024: string;
  w1600?: string | null;
}

@Injectable({ providedIn: 'root' })
export class UploadsService {
  private http = inject(HttpClient);

  // Meglévő – visszafelé kompatibilis
  uploadImage(file: File): Observable<string> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post('/api/Uploads/image', fd, { responseType: 'text' });
  }

  // ÚJ – variánsokkal
  uploadImageVariants(file: File): Observable<ImageVariants> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<ImageVariants>('/api/Uploads/image-variants', fd);
  }
}
