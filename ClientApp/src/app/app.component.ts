import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { MaterialModule } from './material.module';
import { SpinnerComponent } from './shared/spinner/spinner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, RouterOutlet,
    MaterialModule, SpinnerComponent],
  template: `
    <app-spinner></app-spinner>
    <app-header></app-header>
    <router-outlet></router-outlet>
  `
})
export class AppComponent { }
