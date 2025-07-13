import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CardService } from '../../services/card.service';
import { Card } from '../../api';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card-detail',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './card-detail.component.html',
  styleUrls: ['./card-detail.component.scss']
})
export class CardDetailComponent implements OnInit {
  card?: Card;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cardService: CardService
  ) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cardService.getCard(id).subscribe(c => {
      if (!c) this.router.navigate(['/cards']);
      else this.card = c;
    });
  }

  goBack(): void {
    this.router.navigate(['/cards']);
  }
}
