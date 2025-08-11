import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { CardService } from '../../services/card.service';
import type { Card } from '../../api';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

interface Preview {
  title: string;
  contentUrl: string;
  imageSrc: string;
}

@Component({
  selector: 'app-card-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule],
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

  preview: Preview = {
    title: '',
    contentUrl: '',
    imageSrc: '/assets/placeholder.png'
  };

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.cardId = +idParam;

      this.cs.getCard(this.cardId).subscribe(card => {
        this.form.patchValue({
          title: card.title,
          contentUrl: card.contentUrl ?? ''
        });

        const imgPath = card.imageUrl ?? '';
        this.preview = {
          title: card.title ?? '',
          contentUrl: card.contentUrl ?? '',
          imageSrc: `http://localhost:5125${imgPath}`
        };
      });
    }

    this.form.valueChanges.subscribe(({ title, contentUrl }) => {
      this.preview.title = title;
      this.preview.contentUrl = contentUrl;
    });
  }

  onFileSelected(evt: Event) {
    const input = evt.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      this.preview.imageSrc = URL.createObjectURL(this.selectedFile);
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
