import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { CardService } from '../../services/card.service';
import type { Card } from '../../api';

@Component({
  selector: 'app-admin-card-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `
    <div class="p-4">
      <h2 class="text-xl font-bold mb-4">Edit cards</h2>
      <ul class="space-y-2">
        <li *ngFor="let c of cards" class="cursor-pointer hover:underline"
            (click)="edit(c.id!)">
          {{ c.title }}
        </li>
      </ul>
    </div>
  `
})
export class AdminCardListComponent implements OnInit {
  cards: Card[] = [];

  constructor(
    private cs: CardService,
    private router: Router
  ) { }

  ngOnInit() {
    this.cs.getCards().subscribe(cards => this.cards = cards);
  }

  edit(id: number) {
    this.router.navigate(['/admin', 'cards', id, 'edit']);
  }
}
