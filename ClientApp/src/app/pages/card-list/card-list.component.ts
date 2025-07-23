import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { CardService } from '../../services/card.service';
import type { Card } from '../../api';

@Component({
  selector: 'app-card-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatGridListModule,
    MatCardModule,
    MatButtonModule
  ],
  templateUrl: './card-list.component.html',
  styleUrls: ['./card-list.component.scss']
})
export class CardListComponent implements OnInit {
  cards: Card[] = [];
  cols$!: Observable<number>;
  
  constructor(
    private cs: CardService,
    private bp: BreakpointObserver,
    private router: Router
  ) { }

  ngOnInit() {
    this.cs.getCards().subscribe(cards => this.cards = cards);

    this.cols$ = this.bp.observe([
      Breakpoints.XSmall,
      Breakpoints.Small,
      Breakpoints.Medium,
      Breakpoints.Large
    ]).pipe(
      map(result => {
        if (result.breakpoints[Breakpoints.XSmall]) return 1;
        if (result.breakpoints[Breakpoints.Small]) return 2;
        if (result.breakpoints[Breakpoints.Medium]) return 3;
        return 4;
      })
    );
  }

  goDetail(id: number) {
    this.router.navigate(['/cards', id]);
  }
}
