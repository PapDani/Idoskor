import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { HelpBoxComponent } from '../../components/help-box/help-box.component';
import { MenuNode, MenuService } from '../../services/menu.service';
import { slugify } from '../../utils/slugify';

type PageListItem = {
  key: string;
  title: string;
  updatedUtc: string;
  menuPaths: string[];
};

type MenuLabelOption = { id: number; label: string; path: string };

@Component({
  standalone: true,
  selector: 'app-admin-pages-list',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatSnackBarModule, MatSelectModule,
    HelpBoxComponent
  ],
  template: `
    <section class="wrap">
      <header class="head">
        <h1>Oldalak (CMS)</h1>
      </header>

      <app-help-box
        [items]="[
          'Itt látod az összes cikket és a hozzájuk kapcsolódó menüpontokat.',
          'Új cikk létrehozása itt helyben történik (nem navigálunk el).',
          'Menüpont név alapján is kérhetsz kulcs javaslatot (legördülő).',
          'Az első Mentés után a szerkesztőben bővítheted a tartalmat.',
          'Cikk menühöz rendelése: Menü szerkesztő → a megfelelő menüpont „cikk” mezője.'
        ]">
      </app-help-box>

      <form [formGroup]="createForm" class="create-row" (ngSubmit)="create()">
        <mat-form-field appearance="outline" class="menu-name">
          <mat-label>Menüpont név alapján</mat-label>
          <mat-select (selectionChange)="useMenuName($event.value)" [value]="null">
            <mat-option [value]="null">— válassz menüpontot —</mat-option>
            <mat-option *ngFor="let o of menuOptions" [value]="o">{{ o.path }}</mat-option>
          </mat-select>
          <mat-hint>kulcs javaslathoz</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="key">
          <mat-label>Kulcs (URL-barát)</mat-label>
          <input matInput formControlName="key" placeholder="pl. about, kapcsolat, gyakori-kerdesek">
          <mat-hint>kisbetű, szám, kötőjel</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="title">
          <mat-label>Kezdő cím</mat-label>
          <input matInput formControlName="title" placeholder="Cím" (input)="syncKeyFromTitle()">
        </mat-form-field>

        <button mat-raised-button color="primary" type="submit" [disabled]="createForm.invalid">Létrehozás</button>
      </form>

      <table class="grid">
        <thead>
          <tr>
            <th>Key</th>
            <th>Cím</th>
            <th>Menüpont(ok)</th>
            <th>Utoljára frissítve</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of pages">
            <td><code>{{ p.key }}</code></td>
            <td>{{ p.title }}</td>
            <td>
              <ng-container *ngIf="p.menuPaths?.length; else none">
                <div *ngFor="let path of p.menuPaths">{{ path }}</div>
              </ng-container>
              <ng-template #none><span class="muted">— nincs hozzárendelve —</span></ng-template>
            </td>
            <td>{{ p.updatedUtc | date:'yyyy.MM.dd HH:mm' }}</td>
            <td><a [routerLink]="['/admin/pages', p.key]">Szerkesztés</a></td>
          </tr>
        </tbody>
      </table>
    </section>
  `,
  styles: [`
    .wrap{max-width:1100px;margin:1rem auto;padding:0 1rem}
    .head{display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem}
    .create-row{
      display:grid;
      grid-template-columns: 340px 260px 1fr auto;
      gap:.5rem; align-items:end; margin:.5rem 0 1rem
    }
    .menu-name{min-width:320px}
    .key{min-width:240px}
    .title{min-width:300px}
    table.grid{width:100%;border-collapse:collapse}
    table.grid th, table.grid td{border-bottom:1px solid #e6e6e6;padding:.5rem .4rem;text-align:left;vertical-align:top}
    code{background:#f4f4f4;padding:0 .25rem;border-radius:4px}
    .muted{color:#888}
  `]
})
export class AdminPagesListComponent {
  private http = inject(HttpClient);
  private fb = inject(NonNullableFormBuilder);
  private router = inject(Router);
  private snack = inject(MatSnackBar);
  private menu = inject(MenuService);

  pages: PageListItem[] = [];
  menuOptions: MenuLabelOption[] = [];

  createForm = this.fb.group({
    key: this.fb.control('', {
      validators: [
        Validators.required,
        Validators.pattern(/^[a-z0-9-]+$/)
      ]
    }),
    title: this.fb.control('', { validators: [Validators.required] })
  });

  constructor() {
    this.loadPages();
    // lapos lista a menüfa címkéiből (útvonal formában)
    this.menu.tree$.subscribe((t: MenuNode[]) => {
      const out: MenuLabelOption[] = [];
      const walk = (n: MenuNode, trail: string[]) => {
        const path = [...trail, n.label].join(' / ');
        out.push({ id: n.id, label: n.label, path });
        (n.children || []).forEach(c => walk(c, [...trail, n.label]));
      };
      (t ?? []).forEach(n => walk(n, []));
      this.menuOptions = out;
    });
    this.menu.load();
  }

  private loadPages() {
    this.http.get<PageListItem[]>('/api/Pages/admin-list')
      .subscribe(list => this.pages = list);
  }

  useMenuName(opt: MenuLabelOption | null) {
    if (!opt) return;
    const slug = slugify(opt.label);
    // ha a key mezőt még nem írta át kézzel, vagy üres – töltsük
    if (!this.createForm.controls.key.dirty || !this.createForm.controls.key.value) {
      this.createForm.controls.key.setValue(slug);
      this.createForm.controls.key.markAsDirty();
    }
    // ha nincs cím, beírjuk azt is
    if (!this.createForm.controls.title.value) {
      this.createForm.controls.title.setValue(opt.label);
    }
  }

  syncKeyFromTitle(): void {
    const t = this.createForm.controls.title.value ?? '';
    if (!this.createForm.controls.key.dirty || !this.createForm.controls.key.value) {
      this.createForm.controls.key.setValue(slugify(t));
      this.createForm.controls.key.markAsPristine();
    }
  }

  /** Új cikk létrehozása PUT upserttel – nem navigálunk el. */
  create(): void {
    const { key, title } = this.createForm.getRawValue();
    if (!key) return;

    const body = { title: title ?? '', content: '' };
    this.http.put<void>(`/api/Pages/${encodeURIComponent(key)}`, body).subscribe({
      next: () => {
        this.snack.open('Cikk létrehozva ✅', 'Szerkesztés most', { duration: 2500 })
          .onAction().subscribe(() => {
            window.open(`/admin/pages/${encodeURIComponent(key)}`, '_blank');
          });
        this.createForm.reset();
        this.loadPages();
      },
      error: () => this.snack.open('Létrehozás sikertelen ❌', undefined, { duration: 2500 })
    });
  }
}
