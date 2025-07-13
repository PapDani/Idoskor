import { Injectable } from '@angular/core';
import { CardsService } from '../api';     // <-- this comes from cards.service.ts
import { Card }         from '../api';     // <-- this comes from model/card.ts
import { Observable }   from 'rxjs';
import { HttpClient } from '@angular/common/http';

  /*
@Injectable({ providedIn: 'root' })
export class CardService {
  constructor(private cardsService: CardsService) { }


  getCards(): Observable<Card> {
    return this.cardsService.apiCardsGet()
  }

  getCardById(id: number): Observable<Card> {
    return this.cardsService.apiCardsIdGet(id)
  }

  createCard(card: Card): Observable<Card> {
    // pass the card directly
    return this.cardsService.apiCardsPost(card);
  }

  updateCard(id: number, card: Card): Observable<Card> {
    // first arg = id, second = card
    return this.cardsService.apiCardsIdPut(id, card);
  }

  deleteCard(id: number): Observable<void> {
    return this.cardsService.apiCardsIdDelete(id);
  }
}
*/

@Injectable({ providedIn: 'root' })
export class CardService {
  private readonly base = '/api/Cards';

  constructor(private http: HttpClient) {}


getCards(): Observable < Card[] > {
  return this.http.get<Card[]>(this.base);
}


getCard(id: number): Observable < Card > {
  return this.http.get<Card>(`${this.base}/${id}`);
}


createCard(card: Card): Observable < Card > {
  return this.http.post<Card>(this.base, card);
}


updateCard(id: number, card: Card): Observable < Card > {
  return this.http.put<Card>(`${this.base}/${id}`, card);
}


deleteCard(id: number): Observable < void> {
  return this.http.delete<void>(`${this.base}/${id}`);
}
}

