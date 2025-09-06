import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PagesService, PageDto } from '../../services/page.service';
import { UploadsService } from '../../services/uploads.service';
import { QuillModule, QuillModules } from 'ngx-quill';
import Quill from 'quill';
import DOMPurify from 'dompurify';
import { catchError, of } from 'rxjs';

export interface PageEditDialogData { key: string; }

@Component({
  standalone: true,
  selector: 'app-page-edit-dialog',
  imports: [
    CommonModule, MatDialogModule, ReactiveFormsModule, QuillModule,
    MatButtonModule, MatSnackBarModule
  ],
  template: `
  <h2 mat-dialog-title>Cikk szerkesztése — <code>{{ key }}</code></h2>
  <form [formGroup]="form" class="body" (ngSubmit)="save()">
    <input class="title" formControlName="title" placeholder="Cím"/>

    <quill-editor
      [modules]="modules"
      formControlName="content"
      (onEditorCreated)="onEditorCreated($event)">
    </quill-editor>

    <div class="actions">
      <button mat-stroked-button type="button" (click)="close()">Bezár</button>
      <button mat-raised-button color="primary" type="submit" [disabled]="saving">Mentés</button>
    </div>
  </form>
  `,
  styles: [`
    .body{display:grid;gap:.75rem}
    .title{padding:.55rem .7rem;border:1px solid #ddd;border-radius:6px}
    .actions{display:flex;justify-content:flex-end;gap:.5rem;margin-top:.25rem}
    :host ::ng-deep .ql-container{min-height:50vh}
  `]
})
export class PageEditDialogComponent {
  private data = inject<PageEditDialogData>(MAT_DIALOG_DATA);
  private ref = inject(MatDialogRef<PageEditDialogComponent, boolean>);
  private fb = inject(NonNullableFormBuilder);
  private pages = inject(PagesService);
  private uploads = inject(UploadsService);
  private snack = inject(MatSnackBar);

  key = this.data.key;
  saving = false;
  form = this.fb.group({
    title: this.fb.control('', { validators: [Validators.required] }),
    content: this.fb.control('')
  });

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
      handlers: { image: () => this.handleImage() }
    }
  };

  constructor() {
    this.pages.get(this.key)
      .pipe(catchError(err => err?.status === 404
        ? of({ key: this.key, title: '', content: '' } as PageDto)
        : of(null)))
      .subscribe(p => {
        if (!p) return;
        this.form.patchValue({ title: p.title ?? '', content: p.content ?? '' });
      });
  }

  onEditorCreated(ed: Quill) { this.editor = ed; }

  private handleImage(): void {
    if (!this.editor) return;
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0]; if (!file) return;
      this.uploads.uploadImage(file).subscribe((url: string) => {
        const range = this.editor!.getSelection(true);
        const index = range ? range.index : (this.editor!.getLength() || 0);
        this.editor!.insertEmbed(index, 'image', url, 'user');
      });
    };
    input.click();
  }

  save() {
    if (this.saving) return;
    this.saving = true;
    const raw = this.form.getRawValue();
    const cleanHtml = DOMPurify.sanitize(raw.content ?? '');
    this.pages.update(this.key, { title: raw.title ?? '', content: cleanHtml }).subscribe({
      next: () => { this.saving = false; this.snack.open('Mentve ✅', undefined, { duration: 1500 }); this.ref.close(true); },
      error: () => { this.saving = false; this.snack.open('Mentés sikertelen ❌', undefined, { duration: 2500 }); }
    });
  }

  close() { this.ref.close(false); }
}
