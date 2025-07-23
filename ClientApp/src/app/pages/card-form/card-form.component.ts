import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { CardService } from '../../services/card.service';
import type { Card } from '../../api';

@Component({
  selector: 'app-card-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule],
  templateUrl: './card-form.component.html',
  styleUrls: ['./card-form.component.scss']
})
export class CardFormComponent implements OnInit {
  form: FormGroup;
  isEdit = false;
  cardId?: number;

  selectedFile: File | null = null;
  fileTouched = false;

  currentImageName = '';

  constructor(
    private fb: FormBuilder,
    private cs: CardService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      contentUrl: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.cardId = +id;
      this.cs.getCard(this.cardId).subscribe((card: Card) => {
        this.form.patchValue({
          title: card.title,
          contentUrl: card.contentUrl
        });

        const url = card.imageUrl ?? '';
        const parts = url.split('/');
        this.currentImageName = parts.length
          ? parts[parts.length - 1]
          : '';
      });
    }
  }

  onFileSelected(evt: Event): void {
    this.fileTouched = true;
    const input = evt.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    } else {
      this.selectedFile = null;
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    const fd = new FormData();
    fd.append('title', this.form.value.title);
    fd.append('contentUrl', this.form.value.contentUrl);

    if (!this.isEdit || this.selectedFile) {
      fd.append('imageFile', this.selectedFile!);
    }

    if (this.isEdit) {
      this.cs.updateCard(this.cardId!, fd)
        .subscribe(() => this.router.navigate(['/admin/cards']));
    } else {
      this.cs.createCard(fd)
        .subscribe(() => this.router.navigate(['/admin/cards']));
    }
  }

  onDelete(): void {
    if (this.isEdit && this.cardId != null) {
      this.cs.deleteCard(this.cardId)
        .subscribe(() => this.router.navigate(['/admin/cards']));
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/cards']);
  }
}
