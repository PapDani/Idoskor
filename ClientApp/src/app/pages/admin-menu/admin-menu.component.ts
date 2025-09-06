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
import { HelpBoxComponent } from '../../components/help-box/help-box.component';

type PageOption = { key: string; title: string };

@Component({
  standalone: true,
  selector: 'app-admin-menu',
  imports: [
    CommonModule, ReactiveFormsModule, MatButtonModule, MatSlideToggleModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, DragDropModule, MatSnackBarModule,
    HelpBoxComponent
  ],
  template: `
  <section class="wrap">
    <header class="head sticky-top">
      <h1>Menü szerkesztő</h1>
      <div class="head-actions">
        <button mat-stroked-button color="primary" (click)="addRoot()">+ Gyökér menüpont</button>
        <button mat-raised-button color="accent" (click)="saveOrder()" [disabled]="saving()">
          {{ saving() ? 'Mentés...' : 'Sorrend mentése' }}
        </button>
      </div>
    </header>

    <div class="columns">
      <!-- Bal: szerkesztő -->
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

          <!-- Alsó sticky sáv -->
          <div class="sticky-bottom">
            <button mat-raised-button color="accent" (click)="saveOrder()" [disabled]="saving()">
              {{ saving() ? 'Mentés...' : 'Sorrend mentése' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Jobb: sticky Tippek -->
      <aside class="help sticky-aside">
        <app-help-box
          [items]="[
            'Fogd meg a :: ikonnál és húzd a kívánt helyre (drag & drop).',
            'Gyerek-listák közt is áthúzhatsz (root ⇄ child).',
            'A „cikk” mezővel hozzárendelheted az oldalt a menüponthoz.',
            '„látható” ki/be – a fejlécben csak a látható vagy gyerekkel bíró elemek jelennek meg.',
            'Mentés után a fejléc menü azonnal frissül.'
          ]">
        </app-help-box>
      </aside>
    </div>
  </section>
  `,
  styles: [`
    .wrap{max-width:1200px;margin:1rem auto;padding:0 1rem}
    .columns{
      display:grid;
      grid-template-columns: 1fr 320px;
      gap:1rem;
      align-items:start;
    }
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
    .head{display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem}
    .head-actions{display:flex;gap:.5rem}
    .sticky-top{position:sticky;top:0;z-index:5;background:#fff;padding:.5rem 0;border-bottom:1px solid #eee}
    .sticky-bottom{position:sticky;bottom:0;z-index:5;display:flex;justify-content:flex-end;gap:.5rem;padding:.5rem;border-top:1px solid #eee;background:rgba(255,255,255,.9);border-radius:0 0 8px 8px}
    .sticky-aside{position:sticky; top:64px;} /* kb. a toolbar magassága; ha kell, finomítsd */
    @media (max-width: 1024px){
      .columns{grid-template-columns: 1fr}
      .sticky-aside{position:static; top:auto}
    }
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

  get childLists() { return this.tree.map(n => 'list-' + n.id); }

  constructor() {
    this.menu.tree$.subscribe(t => this.tree = t ?? []);
    this.menu.load();

    this.http.get<PageOption[]>('/api/Pages')
      .subscribe(list => this.pages = list.map(p => ({ key: (p as any).key, title: (p as any).title || (p as any).key })));
  }

  trackById = (_: number, n: MenuNode) => n.id;

  addRoot() {
    this.menu.create({ label: 'Új menüpont', order: this.tree.length, isEnabled: true })
      .subscribe(() => this.snack.open('Gyökér menüpont hozzáadva ✅', undefined, { duration: 1500 }));
  }
  addChild(parent: MenuNode) {
    const order = parent.children.length;
    this.menu.create({ label: 'Új almenu', parentId: parent.id, order, isEnabled: true })
      .subscribe(() => this.snack.open('Almenü hozzáadva ✅', undefined, { duration: 1500 }));
  }

  rename(n: MenuNode, label: string) {
    this.menu.update(n.id, {
      label: label || '—',
      slug: n.slug || null,
      parentId: n.parentId,
      order: n.order,
      isEnabled: n.isEnabled,
      pageKey: n.pageKey || null
    }).subscribe(() => this.snack.open('Név mentve ✅', undefined, { duration: 1000 }));
  }

  toggle(n: MenuNode, enabled: boolean) {
    this.menu.update(n.id, {
      label: n.label,
      slug: n.slug || null,
      parentId: n.parentId,
      order: n.order,
      isEnabled: enabled,
      pageKey: n.pageKey || null
    }).subscribe(() => this.snack.open('Láthatóság mentve ✅', undefined, { duration: 1000 }));
  }

  setPage(n: MenuNode, pageKey: string | null) {
    this.menu.update(n.id, {
      label: n.label,
      slug: n.slug || null,
      parentId: n.parentId,
      order: n.order,
      isEnabled: n.isEnabled,
      pageKey
    }).subscribe(() => this.snack.open('Cikk hozzárendelve ✅', undefined, { duration: 1000 }));
  }

  remove(n: MenuNode) {
    if (!confirm('Biztosan törlöd? Előbb mozgasd/ürítsd a gyerekeit.')) return;
    this.menu.delete(n.id).subscribe({
      next: () => this.snack.open('Menüpont törölve ✅', undefined, { duration: 1500 }),
      error: err => this.snack.open((err?.error || 'Törlés sikertelen ❌'), undefined, { duration: 2500 })
    });
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
        this.snack.open('Sorrend elmentve ✅', undefined, { duration: 1500 });
      },
      error: () => {
        this.saving.set(false);
        this.snack.open('Mentés sikertelen ❌', undefined, { duration: 2500 });
      }
    });
  }
}
