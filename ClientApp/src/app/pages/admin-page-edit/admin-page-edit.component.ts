import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { QuillModule, QuillModules } from 'ngx-quill';
import Quill from 'quill';
import DOMPurify from 'dompurify';
import { PagesService, PageDto } from '../../services/page.service';
import { UploadsService } from '../../services/uploads.service';
import { catchError, of } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { HelpBoxComponent } from '../../components/help-box/help-box.component';
import { NewPageDialogComponent, NewPageDialogResult } from './new-page-dialog.component';

type PageOption = { key: string; title: string };

@Component({
  standalone: true,
  selector: 'app-admin-page-edit',
  imports: [
    CommonModule, ReactiveFormsModule, QuillModule,
    MatSnackBarModule, MatButtonModule, MatDialogModule,
    MatFormFieldModule, MatSelectModule,
    HelpBoxComponent
  ],
  template: `
    <section class="wrap">
      <header class="head sticky">
        <div class="left">
          <h1>Oldal szerkesztő</h1>

          <mat-form-field appearance="outline" class="picker">
            <mat-label>Cikk kiválasztása</mat-label>
            <mat-select [value]="key" (selectionChange)="switchPage($event.value)">
              <mat-option *ngFor="let p of pages" [value]="p.key">{{ p.title || p.key }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="actions-top">
          <button mat-stroked-button type="button" (click)="openPublic()">Megnyitás (publikus)</button>
          <button mat-raised-button color="primary" type="button" (click)="newPage()">+ Új cikk</button>
        </div>
      </header>

      <app-help-box
        [items]="[
          'A legördülővel válaszd ki, melyik cikket szerkeszted.',
          '„+ Új cikk” gombbal új kulcs/cím adható, az első Mentés hozza létre.',
          'Képet a képtool gombbal tölthetsz fel; a képek automatikusan beágyazódnak.',
          'Biztonság: a tartalom szerveroldalon is szűrve van (HTML sanitization).',
          'Publikus megjelenítés: /pages/<kulcs>.'
        ]">
      </app-help-box>

      <form [formGroup]="form" class="page-form" (ngSubmit)="save()">
        <div class="meta">
          <input formControlName="title" placeholder="Cím" class="title-input"/>
          <div class="key-line">Kulcs: <code>{{ key }}</code></div>
        </div>

        <div class="editor-shell">
          <quill-editor
            [modules]="modules"
            formControlName="content"
            (onEditorCreated)="onEditorCreated($event)">
          </quill-editor>
        </div>

        <div class="form-actions">
          <button mat-raised-button color="primary" type="submit" [disabled]="saving()">
            {{ saving() ? 'Mentés...' : 'Mentés' }}
          </button>
        </div>
      </form>
    </section>
  `,
  styles: [`
    .wrap{max-width:1100px;margin:1rem auto;padding:0 1rem}
    .head{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:.5rem;gap:.75rem}
    .sticky{position:sticky;top:0;z-index:5;background:#fff;padding:.5rem 0;border-bottom:1px solid #eee}
    .left{display:flex;gap:1rem;align-items:center;flex-wrap:wrap}
    .picker{min-width:280px}
    .actions-top{display:flex;gap:.5rem;align-items:center}
    .page-form { display: grid; gap: 1rem; }
    .meta{display:flex;gap:1rem;align-items:center;flex-wrap:wrap}
    .title-input { flex:1 1 auto; padding: .6rem .8rem; font-size: 1.1rem; border: 1px solid #ddd; border-radius: 6px; }
    .key-line{font-size:.95rem;color:#555}
    .key-line code{background:#f5f5f5;padding:.1rem .3rem;border-radius:4px}
    .editor-shell { border: 1px solid #ddd; border-radius: 6px; overflow: hidden; }
    .editor-shell .ql-container { min-height: 75vh; }
    .editor-shell .ql-editor { min-height: calc(75vh - 42px); }
    .form-actions { display: flex; justify-content: flex-end; gap: .75rem; }
  `]
})
export class AdminPageEditComponent {
  private pagesApi = inject(PagesService);
  private uploads = inject(UploadsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private fb = inject(NonNullableFormBuilder);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  pages: PageOption[] = [];
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
      handlers: { image: () => this.handleImage() }
    }
  };

  onEditorCreated(editor: Quill): void { this.editor = editor; }

  constructor() {
    // page lista a választóhoz
    this.http.get<PageOption[]>('/api/Pages')
      .subscribe(list => this.pages = list.map(p => ({ key: (p as any).key, title: (p as any).title || (p as any).key })));

    this.loadCurrent();
  }

  private loadCurrent(): void {
    this.pagesApi.get(this.key)
      .pipe(
        catchError(err => err?.status === 404
          ? of({ key: this.key, title: '', content: '' } as PageDto)
          : of(null))
      )
      .subscribe((p: PageDto | null) => {
        if (!p) return;
        this.form.patchValue({ title: p.title ?? '', content: p.content ?? '' });
      });
  }

  switchPage(newKey: string): void {
    if (!newKey || newKey === this.key) return;
    this.key = newKey;
    this.router.navigate(['../', newKey], { relativeTo: this.route, replaceUrl: true });
    this.form.reset({ title: '', content: '' });
    this.loadCurrent();
  }

  newPage(): void {
    const ref = this.dialog.open<NewPageDialogComponent, unknown, NewPageDialogResult | undefined>(NewPageDialogComponent, {
      width: '520px',
      disableClose: true
    });
    ref.afterClosed().subscribe((res) => {
      if (!res) return;
      this.key = res.key;
      this.form.reset({ title: res.title, content: '' });
      this.router.navigate(['../', this.key], { relativeTo: this.route, replaceUrl: true });
      this.snack.open(`Új cikk előkészítve: ${this.key} — nyomj Mentést a létrehozáshoz`, undefined, { duration: 2500 });
      // Frissítsük a választó listát is, ha új kulcs
      if (!this.pages.find(p => p.key === this.key)) {
        this.pages = [{ key: this.key, title: res.title || this.key }, ...this.pages];
      }
    });
  }

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

  save(): void {
    if (this.saving()) return;
    this.saving.set(true);

    const raw = this.form.getRawValue();
    const cleanHtml: string = DOMPurify.sanitize(raw.content ?? '');

    this.pagesApi.update(this.key, {
      title: raw.title ?? '',
      content: cleanHtml
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.snack.open('Mentve ✅', undefined, { duration: 2000 });
      },
      error: () => {
        this.saving.set(false);
        this.snack.open('Mentés sikertelen ❌', undefined, { duration: 3000 });
      }
    });
  }

  openPublic(): void { window.open(`/pages/${encodeURIComponent(this.key)}`, '_blank'); }
}
