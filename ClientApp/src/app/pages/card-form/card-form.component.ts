import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardService } from '../../services/card.service';
import { Card } from '../../api';

@Component({
  selector: 'app-card-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './card-form.component.html',
  styleUrls: ['./card-form.component.scss']
})
export class CardFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  cardId?: number;

  constructor(
    private fb: FormBuilder,
    private service: CardService,
    private route: ActivatedRoute,
    private router: Router
  ) {

    this.form = this.fb.group({
      title: ['', Validators.required],
      imageUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\//)]],
      contentUrl: ['', [Validators.required, Validators.pattern(/^\/.+/)]]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.cardId = +idParam;
      this.service.getCard(this.cardId).subscribe(card => {
        this.form.patchValue(card);
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const card: Card = this.form.value as Card;
    if (this.isEdit && this.cardId != null) {
      this.service.updateCard(this.cardId, card)
        .subscribe(() => this.router.navigate(['/cards']));
    } else {
      this.service.createCard(card)
        .subscribe(() => this.router.navigate(['/cards']));
    }
  }

  onDelete(): void {
    if (this.isEdit && this.cardId != null) {
      this.service.deleteCard(this.cardId)
        .subscribe(() => this.router.navigate(['/cards']));
    }
  }
}
