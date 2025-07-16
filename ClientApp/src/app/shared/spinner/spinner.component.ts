import { Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="spinner-backdrop" *ngIf="loadingService.loading$ | async">
      <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
    </div>
  `,
  styles: [`
    .spinner-backdrop {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.7);
      z-index: 1000;
    }
  `]
})
export class SpinnerComponent {
  constructor(public loadingService: LoadingService) { }
}
