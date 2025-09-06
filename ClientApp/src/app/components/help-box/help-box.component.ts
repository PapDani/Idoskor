import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-help-box',
  imports: [CommonModule],
  template: `
    <aside class="help-box" *ngIf="items?.length">
      <h3 class="title">{{ title || 'Tippek' }}</h3>
      <ul class="list">
        <li *ngFor="let item of items">{{ item }}</li>
      </ul>
    </aside>
  `,
  styles: [`
    .help-box{border:1px dashed #cfcfcf;background:#fdfdfd;border-radius:10px;padding:.85rem;margin:.5rem 0}
    .title{margin:0 0 .5rem;font-size:1.05rem;font-weight:700}
    .list{margin:0;padding-left:1.1rem}
    .list li{margin:.25rem 0}
  `]
})
export class HelpBoxComponent {
  @Input() title = 'Tippek';
  @Input() items: string[] = [];
}
