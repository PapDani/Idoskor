import { Component, OnInit } from '@angular/core';
import { CardService } from '../../services/card.service';
import { Card } from '../../api';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card-list',
  standalone: true,
  imports: [
    CommonModule,    // <-- add this
    RouterModule     // <-- for (click)="goDetail(...)"
  ],
  templateUrl: './card-list.component.html',
  styleUrls: ['./card-list.component.scss']
})
export class CardListComponent implements OnInit {
  cards: Card[] = [];

  constructor(
    private cardService: CardService,
    private router: Router
  ) { }


  ngOnInit(): void {
    this.cardService.getCards().subscribe(cards => this.cards = cards);
  }

  goDetail(id?: number) {
    if (id != null) {
      this.router.navigate(['/cards', id]);
    }
  }
}
