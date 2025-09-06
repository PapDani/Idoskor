import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { slugify } from '../../utils/slugify';

export interface NewPageDialogResult {
  key: string;
  title: string;
}

@Component({
  standalone: true,
  selector: 'app-new-page-dialog',
  imports: [
    CommonModule, MatDialogModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule
  ],
  template: `
  <h2 mat-dialog-title>Új cikk</h2>
  <form [formGroup]="form" (ngSubmit)="confirm()" class="body">
    <mat-form-field appearance="outline">
      <mat-label>Cím</mat-label>
      <input matInput formControlName="title" (input)="syncKeyFromTitle()">
    </mat-form-field>

    <mat-form-field appearance="outline">
      <mat-label>Kulcs (URL-barát)</mat-label>
      <input matInput formControlName="key" placeholder="pl. rolunk, kapcsolat" />
      <mat-hint>kisbetű, szám, kötőjel – a cím alapján generálható</mat-hint>
    </mat-form-field>

    <div class="actions">
      <button mat-stroked-button type="button" (click)="cancel()">Mégse</button>
      <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Létrehozás</button>
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

  form = this.fb.group({
    title: this.fb.control('', { validators: [Validators.required] }),
    key: this.fb.control('', { validators: [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)] })
  });

  syncKeyFromTitle(): void {
    const t = this.form.controls.title.value ?? '';
    // csak akkor írjuk, ha a user még nem írta át kézzel
    if (!this.form.dirty || this.form.controls.key.pristine) {
      this.form.controls.key.setValue(slugify(t));
      this.form.controls.key.markAsPristine();
    }
  }

  cancel(): void { this.ref.close(undefined); }

  confirm(): void {
    if (this.form.invalid) return;
    const { key, title } = this.form.getRawValue();
    this.ref.close({ key: key!, title: title! });
  }
}
