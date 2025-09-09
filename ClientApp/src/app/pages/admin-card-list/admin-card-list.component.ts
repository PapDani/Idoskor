import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CardService, Card } from '../../services/card.service';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

type PageOption = { key: string; title: string };

@Component({
  standalone: true,
  selector: 'app-admin-cards',
  imports: [CommonModule, MatSelectModule, MatButtonModule, MatSnackBarModule, RouterLink, DragDropModule],
  templateUrl: './admin-card-list.component.html'
})
export class AdminCardsComponent {
  private http = inject(HttpClient);
  private snack = inject(MatSnackBar);
  private cardsApi = inject(CardService);
  private router = inject(Router);

  cards: Card[] = [];
  pages: PageOption[] = [];

  ngOnInit(): void {
    this.reload();
    this.http.get<PageOption[]>('/api/Pages').subscribe(list => {
      this.pages = list.map(p => ({ key: (p as any).key, title: (p as any).title || (p as any).key }));
    });
  }

  reload() {
    // Adminban manuális rend szerint kérjük
    this.cardsApi.list('asc', 'manual').subscribe(list => this.cards = list);
  }

  // Drag&drop callback
  drop(event: CdkDragDrop<Card[]>) {
    moveItemInArray(this.cards, event.previousIndex, event.currentIndex);
    const payload = this.cards.map((c, idx) => ({ id: c.id, order: idx }));
    this.cardsApi.reorder(payload).subscribe({
      next: () => this.snack.open('Sorrend mentve ✅', undefined, { duration: 1200 }),
      error: () => this.snack.open('Sorrend mentése sikertelen ❌', undefined, { duration: 2000 })
    });
  }

  setPage(card: Card, key: string | null) {
    this.cardsApi.setPage(card.id, key).subscribe({
      next: () => { this.snack.open('Cikk hozzárendelve ✅', undefined, { duration: 1500 }); this.reload(); },
      error: () => this.snack.open('Mentés sikertelen ❌', undefined, { duration: 2500 })
    });
  }

  clearPage(card: Card) {
    this.setPage(card, null);
  }

  /** Szerkesztés: ha nálad az útvonal /admin/cards/:id, módosítsd itt. */
  edit(card: Card) {
    this.router.navigate(['/admin/cards', card.id, 'edit']);
  }

  delete(card: Card) {
    if (!confirm(`Biztosan törlöd a kártyát? (#${card.id} – ${card.title})`)) return;
    this.cardsApi.delete(card.id).subscribe({
      next: () => { this.snack.open('Kártya törölve ✅', undefined, { duration: 1500 }); this.reload(); },
      error: () => this.snack.open('Törlés sikertelen ❌', undefined, { duration: 2500 })
    });
  }

  trackId = (_: number, c: Card) => c.id;
}
