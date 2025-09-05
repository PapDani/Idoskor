import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { QuillModule, QuillModules } from 'ngx-quill';
import Quill from 'quill';
import DOMPurify from 'dompurify';
import { PagesService, PageDto } from '../../services/page.service';
import { UploadsService } from '../../services/uploads.service';
import { catchError, of } from 'rxjs';

// Angular Material snackbar + button a standalone komponenshez
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-admin-page-edit',
  imports: [CommonModule, ReactiveFormsModule, QuillModule, MatSnackBarModule, MatButtonModule],
  template: `
    <form [formGroup]="form" class="page-form" (ngSubmit)="save()">
      <input formControlName="title" placeholder="Cím" class="title-input"/>

      <div class="editor-shell">
        <quill-editor
          [modules]="modules"
          formControlName="content"
          (onEditorCreated)="onEditorCreated($event)">
        </quill-editor>
      </div>

      <div class="form-actions">
        <button mat-raised-button color="primary" type="submit" [disabled]="saving()">Mentés</button>
        <button mat-stroked-button type="button" (click)="openPublic()">Megnyitás (publikus)</button>
      </div>
    </form>
  `,
  styles: [`
    .page-form { display: grid; gap: 1rem; max-width: 1100px; margin: 1rem auto; }
    .title-input { padding: .6rem .8rem; font-size: 1.1rem; border: 1px solid #ddd; border-radius: 6px; }
    /* nagy editor */
    .editor-shell { border: 1px solid #ddd; border-radius: 6px; overflow: hidden; }
    .editor-shell .ql-container { min-height: 75vh; }
    .editor-shell .ql-editor { min-height: calc(75vh - 42px); }
    /* gombok az editor ALATT, nem belelógva */
    .form-actions { display: flex; justify-content: flex-end; gap: .75rem; }
  `]
})
export class AdminPageEditComponent {
  private pages = inject(PagesService);
  private uploads = inject(UploadsService);
  private route = inject(ActivatedRoute);
  private fb = inject(NonNullableFormBuilder);
  private snack = inject(MatSnackBar);

  key = this.route.snapshot.paramMap.get('key') ?? 'about';
  form = this.fb.group({
    title: this.fb.control('', { validators: [Validators.required] }),
    content: this.fb.control('')
  });
  saving = signal(false);
  private editor: Quill | null = null;

  modules: QuillModules = {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline'],
        [{ header: [1, 2, 3, false] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: () => this.handleImage()
      }
    }
  };

  onEditorCreated(editor: Quill): void {
    this.editor = editor;
  }

  constructor() {
    this.pages.get(this.key)
      .pipe(
        catchError(err => {
          // 404 esetén üres formot nyitunk; Mentéskor upsert létrehozza
          if (err?.status === 404) {
            return of({ key: this.key, title: '', content: '' } as PageDto);
          }
          throw err;
        })
      )
      .subscribe((p: PageDto) => {
        this.form.patchValue({
          title: p.title ?? '',
          content: p.content ?? ''
        });
      });
  }

  private handleImage(): void {
    if (!this.editor) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      this.uploads.uploadImage(file).subscribe((url: string) => {
        const range = this.editor!.getSelection(true);
        const index = range ? range.index : (this.editor!.getLength() || 0);
        this.editor!.insertEmbed(index, 'image', url, 'user');
      });
    };
    input.click();
  }

  save(): void {
    if (this.saving()) return;
    this.saving.set(true);

    const raw = this.form.getRawValue();
    const cleanHtml: string = DOMPurify.sanitize(raw.content ?? '');

    this.pages.update(this.key, {
      title: raw.title ?? '',
      content: cleanHtml
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.snack.open('Mentve ✅', undefined, { duration: 2000 });
        // itt maradunk az oldalon; nem navigálunk el
      },
      error: () => {
        this.saving.set(false);
        this.snack.open('Mentés sikertelen ❌', undefined, { duration: 3000 });
      }
    });
  }

  openPublic(): void {
    window.open(`/pages/${encodeURIComponent(this.key)}`, '_blank');
  }
}
