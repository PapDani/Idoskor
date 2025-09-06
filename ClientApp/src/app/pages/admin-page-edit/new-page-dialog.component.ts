import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { HttpClient } from '@angular/common/http';
import { map, of, catchError } from 'rxjs';
import { MenuNode, MenuService } from '../../services/menu.service';
import { slugify, slugifyPath } from '../../utils/slugify';

export interface NewPageDialogResult { key: string; title: string; }
type MenuLabelOption = { id: number; label: string; path: string };

@Component({
  standalone: true,
  selector: 'app-new-page-dialog',
  imports: [
    CommonModule, MatDialogModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule
  ],
  template: `
  <h2 mat-dialog-title>Új cikk</h2>
  <form [formGroup]="form" (ngSubmit)="confirm()" class="body">
    <mat-form-field appearance="outline">
      <mat-label>Menüpont név alapján (opcionális)</mat-label>
      <mat-select (selectionChange)="useMenuName($event.value)" [value]="null">
        <mat-option [value]="null">— válassz menüpontot —</mat-option>
        <mat-option *ngFor="let o of menuOptions" [value]="o">{{ o.path }}</mat-option>
      </mat-select>
      <mat-hint>Kulcsjavaslat a kiválasztott menü alapján</mat-hint>
    </mat-form-field>

    <mat-form-field appearance="outline">
      <mat-label>Cím</mat-label>
      <input matInput formControlName="title" (input)="syncKeyFromTitle()">
    </mat-form-field>

    <mat-form-field appearance="outline">
      <mat-label>Kulcs (URL-barát)</mat-label>
      <input matInput formControlName="key" placeholder="pl. rolunk, kapcsolat" (blur)="checkDup()"/>
      <mat-hint>kisbetű, szám, kötőjel</mat-hint>
      <mat-error *ngIf="form.controls.key.hasError('duplicate')">
        Ez a kulcs már létezik. Válassz másikat.
      </mat-error>
    </mat-form-field>

    <div class="actions">
      <button mat-stroked-button type="button" (click)="cancel()">Mégse</button>
      <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || checkingDup">
        {{ checkingDup ? 'Ellenőrzés…' : 'Létrehozás' }}
      </button>
    </div>
  </form>
  `,
  styles: [`
    .body { display: grid; gap: .75rem; padding: .25rem 0 .5rem }
    .actions { display:flex; gap:.5rem; justify-content:flex-end; margin-top:.5rem }
  `]
})
export class NewPageDialogComponent {
  private fb = inject(NonNullableFormBuilder);
  private ref = inject(MatDialogRef<NewPageDialogComponent, NewPageDialogResult | undefined>);
  private http = inject(HttpClient);
  private menu = inject(MenuService);

  menuOptions: MenuLabelOption[] = [];
  checkingDup = false;

  form = this.fb.group({
    title: this.fb.control('', { validators: [Validators.required] }),
    key: this.fb.control('', { validators: [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)] })
  });

  constructor() {
    // Menü opciók előkészítése (útvonalas label)
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

  useMenuName(opt: MenuLabelOption | null) {
    if (!opt) return;
    const slug = slugifyPath(opt.path);
    // töltsük a key-t, ha a user még nem írta át / üres
    if (!this.form.controls.key.dirty || !this.form.controls.key.value) {
      this.form.controls.key.setValue(slug);
      this.form.controls.key.markAsDirty();
    }
    // cím, ha üres
    if (!this.form.controls.title.value) {
      this.form.controls.title.setValue(opt.label);
    }
  }

  syncKeyFromTitle(): void {
    const t = this.form.controls.title.value ?? '';
    if (!this.form.controls.key.dirty || !this.form.controls.key.value) {
      this.form.controls.key.setValue(slugify(t));
      this.form.controls.key.markAsPristine();
    }
  }

  checkDup(): void {
    const key = this.form.controls.key.value?.trim();
    if (!key) return;
    this.checkingDup = true;
    this.http.get(`/api/Pages/${encodeURIComponent(key)}`, { observe: 'response' })
      .pipe(
        map(() => true), // 200 -> létezik
        catchError(err => of(err?.status === 404 ? false : true))
      )
      .subscribe(exists => {
        this.checkingDup = false;
        this.form.controls.key.setErrors(exists ? { ...(this.form.controls.key.errors || {}), duplicate: true } : null);
      });
  }

  cancel(): void { this.ref.close(undefined); }

  confirm(): void {
    if (this.form.invalid) return;
    const key = this.form.controls.key.value!;
    const title = this.form.controls.title.value!;
    this.ref.close({ key, title });
  }
}
