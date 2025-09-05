import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class UploadsService {
  private http = inject(HttpClient);
  private base = '/api/Uploads';

  uploadImage(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ url: string }>(this.base, form)
      .pipe(map(r => r.url));
  }
}
