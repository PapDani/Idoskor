import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { PageService } from '../../services/page.service';

 @Component({
 selector: 'app-admin-page-edit',
      standalone: true,
      imports: [CommonModule, FormsModule, QuillModule, MatButtonModule, RouterModule],
      template: `
    <h2 class="mb-4">Oldal szerkesztése: {{ key }}</h2>
    <quill-editor
      [(ngModel)]="content"
      [format]="'html'"
      [placeholder]="'Írd ide a tartalmat…'"
      [modules]="modules"
      theme="snow"
      class="editor">
    </quill-editor>
    <div class="mt-4 flex gap-2">
      <button mat-raised-button color="primary" (click)="save()">Mentés</button>
      <button mat-button (click)="back()">Mégse</button>
    </div>
  `,
      styles: [`.editor{min-height:300px}`]
  })
  export class AdminPageEditComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private pages = inject(PageService);

    key = '';
  content = '';

    modules = {
      toolbar: {
          container: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['link', 'image'],
      ['clean']
            ],
            handlers: {
              image: () => this.selectAndUploadImage()
              }
        }
    };

    ngOnInit() {
      this.key = this.route.snapshot.paramMap.get('key') ?? '';
      if (!this.key) return;
      this.pages.get(this.key).subscribe(p => this.content = p.content ?? '');
    }

    save() {
      this.pages.save(this.key, this.key, this.content).subscribe(() => this.back());
    }

    back() { this.router.navigate(['/admin/pages']); }

    private selectAndUploadImage() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
          const file = input.files?.[0];
          if (!file) return;
          const fd = new FormData(); fd.append('file', file);
          this.http.post<{ url: string }>('/api/Uploads', fd, {
 reportProgress: true, observe: 'events'
          }).subscribe(evt => {
              if (evt.type === HttpEventType.Response && evt.body?.url) {
                  // beszúrás a kurzorhoz:
                    const editorEl = document.querySelector('.ql-editor') as HTMLElement;
                  const Quill = (window as any).Quill || (await import('quill')).default;
                  const editor = (Quill as any).find(editorEl);
                  const range = editor.getSelection(true);
                  editor.insertEmbed(range.index, 'image', evt.body.url, 'user');
                  editor.setSelection(range.index + 1, 0);
                }
            });
      };
    input.click();
  }
}
