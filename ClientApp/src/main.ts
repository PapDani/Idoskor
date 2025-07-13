import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

import { Configuration } from './app/api/configuration';
import { JwtInterceptor } from './app/interceptors/jwt.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    // Override basePath so the client calls “/api” on port 4200:
    {
      provide: Configuration,
      useValue: new Configuration({ basePath: '' })
    },
    
  ]
}).catch(err => console.error(err));
