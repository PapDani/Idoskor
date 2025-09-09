import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { CardService, Card, UpsertCardDto } from '../../services/card.service';
import { UploadsService } from '../../services/uploads.service';

@Component({
  standalone: true,
  selector: 'app-card-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatCardModule
  ],
  templateUrl: './card-form.component.html'
})
export class CardFormComponent {
  private fb = inject(NonNullableFormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snack = inject(MatSnackBar);
  private cs = inject(CardService);
  private upload = inject(UploadsService);

  cardId: number | null = null;
  previewUrl: string | null = null;

  // Ha kötelezővé akarod tenni a képet, add hozzá a Validators.required-öt az imageUrl-hez
  form = this.fb.group({
    title: this.fb.control('', { validators: [Validators.required] }),
    imageUrl: this.fb.control(''),
    contentUrl: this.fb.control(''),
  });

  get isEdit() { return this.cardId != null; }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && /^\d+$/.test(idParam)) {
      this.cardId = Number(idParam);
      this.cs.get(this.cardId).subscribe((c: Card) => {
        this.form.setValue({
          title: c.title ?? '',
          imageUrl: c.imageUrl ?? '',
          contentUrl: c.contentUrl ?? '',
        });
        this.previewUrl = c.imageUrl ?? null;
      });
    }
  }

  onFileChange(ev: Event) {
    const files = (ev.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;
    const f = files[0];

    // Variánsos feltöltés → az 1024-es WebP-t írjuk az imageUrl-be
    this.upload.uploadImageVariants(f).subscribe({
      next: vars => {
        const url = vars.w1024 || vars.w640 || vars.original;
        this.form.controls.imageUrl.setValue(url);
        this.previewUrl = url;
        this.snack.open('Kép feltöltve ✅', undefined, { duration: 1200 });
      },
      error: () => this.snack.open('Feltöltés sikertelen ❌', undefined, { duration: 2000 })
    });
  }

  onSubmit() { this.save(); }
  save() {
    if (this.form.invalid) return;

    const upsert: UpsertCardDto = {
      title: this.form.controls.title.value.trim(),
      imageUrl: this.form.controls.imageUrl.value.trim() || null,
      contentUrl: this.form.controls.contentUrl.value.trim() || null,
    };

    if (this.cardId) {
      this.cs.update(this.cardId, upsert).subscribe({
        next: () => { this.snack.open('Kártya mentve ✅', undefined, { duration: 1200 }); this.router.navigate(['/admin/cards']); },
        error: () => this.snack.open('Mentés sikertelen ❌', undefined, { duration: 2000 })
      });
    } else {
      this.cs.create(upsert).subscribe({
        next: () => { this.snack.open('Kártya létrehozva ✅', undefined, { duration: 1200 }); this.router.navigate(['/admin/cards']); },
        error: () => this.snack.open('Létrehozás sikertelen ❌', undefined, { duration: 2000 })
      });
    }
  }

  onDelete() {
    if (!this.cardId) return;
    if (!confirm('Biztosan törlöd a kártyát?')) return;
    this.cs.delete(this.cardId).subscribe({
      next: () => { this.snack.open('Kártya törölve ✅', undefined, { duration: 1200 }); this.router.navigate(['/admin/cards']); },
      error: () => this.snack.open('Törlés sikertelen ❌', undefined, { duration: 2000 })
    });
  }

  goBack() { this.router.navigate(['/admin/cards']); }
}
