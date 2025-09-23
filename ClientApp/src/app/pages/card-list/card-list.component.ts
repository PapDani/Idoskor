import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { CardService, Card } from '../../services/card.service';

@Component({
  standalone: true,
  selector: 'app-cards',
  imports: [CommonModule, RouterLink, MatCardModule],
  template: `
    <section class="wrap">
      <h1>Hírek</h1>
      <div class="grid">
        <a class="card-link" *ngFor="let c of cards"
           [routerLink]="c.pageKey ? ['/pages', c.pageKey] : ['/cards', c.id]">
          <mat-card class="card">
            <img mat-card-image *ngIf="c.imageUrl" [src]="c.imageUrl" [alt]="c.title">
            <mat-card-title>{{ c.title }}</mat-card-title>
          </mat-card>
        </a>
      </div>
    </section>
  `,
  styles: [`
    .wrap{max-width:1100px;margin:1rem auto;padding:0 1rem}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
    .card-link{text-decoration:none;color:inherit}
    .card{border-radius:12px;overflow:hidden;background:#fff}
    .card img{height:160px;object-fit:cover}
  `]
})
export class CardsComponent {
  private cardsApi = inject(CardService);
  cards: Card[] = [];
  ngOnInit(): void {
    // Adminban beállított manuális sorrend
    this.cardsApi.list('asc', 'manual').subscribe(list => this.cards = list);
  }
}
