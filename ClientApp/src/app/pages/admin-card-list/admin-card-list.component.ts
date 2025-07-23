import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule, Router } from '@angular/router';
import { CardService } from '../../services/card.service';
import type { Card } from '../../api';

@Component({
  selector: 'app-admin-card-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, RouterModule],
  templateUrl: './admin-card-list.component.html',
  styleUrls: ['./admin-card-list.component.scss']
})
export class AdminCardsComponent implements OnInit {
  displayedColumns = ['index', 'id', 'title', 'contentUrl', 'imageUrl', 'actions'];
  dataSource: Card[] = [];

  constructor(private cs: CardService, private router: Router) { }

  ngOnInit() { this.loadCards(); }
  private loadCards() {
    this.cs.getCards().subscribe(cs => this.dataSource = cs);
  }

  newCard() { this.router.navigate(['admin', 'cards', 'new']); }
  edit(id: number) { this.router.navigate(['/admin', 'cards', id, 'edit']); }
  delete(id: number) { this.cs.deleteCard(id).subscribe(() => this.loadCards()); }
}
