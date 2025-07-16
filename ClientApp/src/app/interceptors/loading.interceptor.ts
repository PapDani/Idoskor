import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest,
  HttpHandler, HttpEvent
} from '@angular/common/http';
import { finalize, Observable } from 'rxjs';
import { LoadingService } from '../services/loading.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  constructor(private ls: LoadingService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler)
    : Observable<HttpEvent<any>> {
    this.ls.show();
    return next.handle(req).pipe(
      finalize(() => this.ls.hide())
    );
  }
}
