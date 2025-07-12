import { Injectable } from '@angular/core';
import { CardsService } from '../api';     // <-- this comes from cards.service.ts
import { Card }         from '../api';     // <-- this comes from model/card.ts
import { Observable }   from 'rxjs';


@Injectable({ providedIn: 'root' })
export class CardService {
  constructor(private cardsService: CardsService) {}

  /** get all cards */
  getCards(): Observable<Card[]> {
    // the exact method name may be cardsService.cardsControllerGet()
    return this.cardsService.apiCardsGet();
  }

  /** get a single card by id */
  getCard(id: number): Observable<Card> {
    return this.cardsService.apiCardsIdGet(id);
  }
}
