import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardService, Card } from '../../services/card.service';

@Component({
  standalone: true,
  selector: 'app-cards',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="cards">
      <ng-container *ngFor="let c of cards">
        <!-- Ha van cikk hozzárendelve: direkt /pages/:key -->
        <a *ngIf="c.pageKey; else gotoDetail" [routerLink]="['/pages', c.pageKey]" class="card">
          <img *ngIf="c.imageUrl" [src]="c.imageUrl" alt="{{ c.title }}">
          <h3>{{ c.title }}</h3>
        </a>
        <!-- Ha nincs cikk: /cards/:id részlet -->
        <ng-template #gotoDetail>
          <a [routerLink]="['/cards', c.id]" class="card">
            <img *ngIf="c.imageUrl" [src]="c.imageUrl" alt="{{ c.title }}">
            <h3>{{ c.title }}</h3>
          </a>
        </ng-template>
      </ng-container>
    </section>
  `,
  styles: [`
    .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem}
    .card{border:1px solid #eee;border-radius:8px;padding:.5rem;display:block;text-decoration:none;color:inherit}
    .card img{width:100%;height:160px;object-fit:cover;border-radius:6px}
  `]
})
export class CardsComponent {
  private cardsApi = inject(CardService);
  cards: Card[] = [];

  ngOnInit(): void {
    this.cardsApi.list('desc').subscribe(list => this.cards = list);
  }
}
