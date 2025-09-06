import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuNode, MenuService, ReorderItem } from '../../services/menu.service';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

type PageOption = { key: string; title: string };

@Component({
  standalone: true,
  selector: 'app-admin-menu',
  imports: [
    CommonModule, ReactiveFormsModule, MatButtonModule, MatSlideToggleModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, DragDropModule, MatSnackBarModule
  ],
  template: `
  <section class="wrap">
    <header class="head">
      <h1>Menü szerkesztő</h1>
      <button mat-raised-button color="primary" (click)="addRoot()">+ Gyökér menüpont</button>
    </header>

    <div class="columns">
      <!-- Fő szerkesztő (fa + akciógomb alatta) -->
      <div class="tree-area">
        <div class="tree">
          <div class="root"
               cdkDropList
               [cdkDropListData]="tree"
               (cdkDropListDropped)="onDrop($event, null)"
               [cdkDropListConnectedTo]="childLists">
            <div class="node" *ngFor="let n of tree; trackBy: trackById" cdkDrag>
              <div class="node-row">
                <span class="drag-handle" cdkDragHandle>::</span>
                <input class="title" [value]="n.label" (change)="rename(n, $any($event.target).value)">
                <mat-slide-toggle [checked]="n.isEnabled" (change)="toggle(n, $event.checked)">látható</mat-slide-toggle>
                <button mat-stroked-button (click)="addChild(n)">+ almenu</button>
                <button mat-stroked-button color="warn" (click)="remove(n)">Törlés</button>
              </div>

              <!-- gyerekek -->
              <div class="children"
                   cdkDropList
                   [id]="'list-'+n.id"
                   [cdkDropListData]="n.children"
                   (cdkDropListDropped)="onDrop($event, n.id)"
                   [cdkDropListConnectedTo]="childLists">
                <div class="node child" *ngFor="let c of n.children; trackBy: trackById" cdkDrag>
                  <div class="node-row">
                    <span class="drag-handle" cdkDragHandle>::</span>
                    <input class="title" [value]="c.label" (change)="rename(c, $any($event.target).value)">
                    <mat-slide-toggle [checked]="c.isEnabled" (change)="toggle(c, $event.checked)">látható</mat-slide-toggle>

                    <mat-form-field appearance="outline" class="page-select">
                      <mat-select [value]="c.pageKey || null" (selectionChange)="setPage(c, $event.value)">
                        <mat-option [value]="null">— nincs cikk hozzárendelve —</mat-option>
                        <mat-option *ngFor="let p of pages" [value]="p.key">{{ p.title || p.key }}</mat-option>
                      </mat-select>
                      <span matTextPrefix>cikk:</span>
                    </mat-form-field>

                    <button mat-stroked-button color="warn" (click)="remove(c)">Törlés</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- AKCIÓSÁV A SZERKESZTŐ ALATT -->
          <div class="actions">
            <button mat-raised-button color="accent" (click)="saveOrder()" [disabled]="saving()">
              {{ saving() ? 'Mentés...' : 'Sorrend mentése' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Tippek oldalsáv -->
      <aside class="help">
        <h3>Tippek</h3>
        <ul>
          <li>Fogd meg a <strong>::</strong> ikonnál és húzd a kívánt helyre (drag & drop).</li>
          <li>Gyerek-listák között is áthúzhatsz (root ⇄ child).</li>
          <li>A „cikk” mezővel hozzárendelheted a kiválasztott oldalt a menüponthoz.</li>
          <li>„látható” ki/be – a fejlécben csak a látható vagy gyerekkel bíró elemek jelennek meg.</li>
        </ul>
      </aside>
    </div>
  </section>
  `,
  styles: [`
    .wrap{max-width:1200px;margin:1rem auto;padding:0 1rem}
    .head{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem}
    .columns{display:grid;grid-template-columns:1fr 320px;gap:1rem}
    .tree-area{display:flex;flex-direction:column;gap:.75rem}
    .tree{border:1px solid #e6e6e6;border-radius:8px;background:#fff}
    .root, .children{min-height:2rem;padding:.75rem}
    .node{border:1px solid #eee;border-radius:6px;margin:.5rem 0;background:#fafafa}
    .node.child{background:#fff}
    .node-row{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;padding:.5rem}
    .drag-handle{cursor:grab;padding:0 .25rem;color:#666}
    .title{flex:1 1 240px;padding:.4rem .5rem;border:1px solid #ddd;border-radius:6px}
    .page-select{min-width:260px}
    .children{margin-left:2rem;border-left:2px dotted #eee}
    .actions{display:flex;justify-content:flex-end;padding:.75rem;border-top:1px solid #eee;background:#fafafa;border-radius:0 0 8px 8px}
    aside.help{border:1px dashed #ccc;border-radius:8px;padding:.75rem;background:#fdfdfd}
  `]
})
export class AdminMenuComponent {
  private menu = inject(MenuService);
  private http = inject(HttpClient);
  private fb = inject(NonNullableFormBuilder);
  private snack = inject(MatSnackBar);

  tree: MenuNode[] = [];
  pages: PageOption[] = [];
  saving = signal(false);

  get childLists() {
    return this.tree.map(n => 'list-' + n.id);
  }

  constructor() {
    this.reload();
    this.http.get<PageOption[]>('/api/Pages')
      .subscribe(list => this.pages = list.map(p => ({ key: (p as any).key, title: (p as any).title || (p as any).key })));
  }

  reload() {
    this.menu.getTree().subscribe(t => this.tree = t ?? []);
  }

  trackById = (_: number, n: MenuNode) => n.id;

  addRoot() {
    this.menu.create({ label: 'Új menüpont', order: this.tree.length, isEnabled: true }).subscribe(() => this.reload());
  }

  addChild(parent: MenuNode) {
    const order = parent.children.length;
    this.menu.create({ label: 'Új almenu', parentId: parent.id, order, isEnabled: true }).subscribe(() => this.reload());
  }

  rename(n: MenuNode, label: string) {
    this.menu.update(n.id, {
      label: label || '—',
      slug: n.slug || null,
      parentId: n.parentId,
      order: n.order,
      isEnabled: n.isEnabled,
      pageKey: n.pageKey || null
    }).subscribe(() => this.reload());
  }

  toggle(n: MenuNode, enabled: boolean) {
    this.menu.update(n.id, {
      label: n.label,
      slug: n.slug || null,
      parentId: n.parentId,
      order: n.order,
      isEnabled: enabled,
      pageKey: n.pageKey || null
    }).subscribe(() => this.reload());
  }

  setPage(n: MenuNode, pageKey: string | null) {
    this.menu.update(n.id, {
      label: n.label,
      slug: n.slug || null,
      parentId: n.parentId,
      order: n.order,
      isEnabled: n.isEnabled,
      pageKey: pageKey
    }).subscribe(() => this.reload());
  }

  remove(n: MenuNode) {
    if (!confirm('Biztosan törlöd? Előbb mozgasd/ürítsd a gyerekeit.')) return;
    this.menu.delete(n.id).subscribe(() => this.reload());
  }

  onDrop(event: CdkDragDrop<MenuNode[]>, newParentId: number | null) {
    const prev = event.previousContainer.data;
    const curr = event.container.data;

    if (event.previousContainer === event.container) {
      moveItemInArray(curr, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(prev, curr, event.previousIndex, event.currentIndex);
    }

    curr.forEach((item, idx) => {
      item.parentId = newParentId;
      item.order = idx;
    });
  }

  saveOrder() {
    if (this.saving()) return;
    this.saving.set(true);

    const payload: ReorderItem[] = [];
    this.tree.forEach((n, idx) => payload.push({ id: n.id, parentId: null, order: idx }));
    this.tree.forEach(parent => {
      parent.children.forEach((c, idx) => payload.push({ id: c.id, parentId: parent.id, order: idx }));
    });

    this.menu.reorder(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.snack.open('Sorrend elmentve ✅', undefined, { duration: 2000 });
      },
      error: () => {
        this.saving.set(false);
        this.snack.open('Mentés sikertelen ❌', undefined, { duration: 3000 });
      }
    });
  }
}
