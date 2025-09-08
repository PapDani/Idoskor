import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardService, Card } from '../../services/card.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-card-detail',
  imports: [CommonModule, MatButtonModule],
  templateUrl: './card-detail.component.html'
})
export class CardDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cards = inject(CardService);

  card?: Card;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigate(['/cards']); return; }

    this.cards.get(id).subscribe(c => {
      // HA van cikk hozzárendelve, közvetlenül arra megyünk, DE replaceUrl-lel,
      // így a history-ban nem marad bent a /cards/:id köztes lépcső.
      if (c.pageKey) {
        this.router.navigate(['/pages', c.pageKey], { replaceUrl: true });
        return;
      }
      this.card = c;
    });
  }

  goBack() {
    history.back();
  }
}
