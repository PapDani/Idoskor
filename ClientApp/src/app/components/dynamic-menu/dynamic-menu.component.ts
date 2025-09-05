import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MenuNode, MenuService } from '../../services/menu.service';

@Component({
  standalone: true,
  selector: 'app-dynamic-menu',
  imports: [CommonModule, MatMenuModule, MatButtonModule, RouterLink],
  template: `
    <nav class="menu-bar" *ngIf="tree.length; else fallback">
      <ng-container *ngFor="let node of tree; trackBy: trackById">
        <!-- root gomb a saját menüjével -->
        <button
          mat-button
          [matMenuTriggerFor]="menu"
          [disabled]="!node.isEnabled && !node.children.length">
          {{ node.label }}
        </button>

        <mat-menu #menu="matMenu">
          <ng-container *ngFor="let child of node.children; trackBy: trackById">
            <!-- leaf elem: közvetlenül oldalra mutat -->
            <button
              mat-menu-item
              *ngIf="!child.children.length"
              [routerLink]="child.pageKey ? ['/pages', child.pageKey] : null"
              [disabled]="!child.isEnabled || !child.pageKey">
              {{ child.label }}
            </button>

            <!-- belső csomópont: további menü (3. szint opcionális) -->
            <ng-container *ngIf="child.children.length">
              <button
                mat-menu-item
                [matMenuTriggerFor]="subMenu"
                [disabled]="!child.isEnabled">
                {{ child.label }}
              </button>
              <mat-menu #subMenu="matMenu">
                <button
                  mat-menu-item
                  *ngFor="let grand of child.children; trackBy: trackById"
                  [routerLink]="grand.pageKey ? ['/pages', grand.pageKey] : null"
                  [disabled]="!grand.isEnabled || !grand.pageKey">
                  {{ grand.label }}
                </button>
              </mat-menu>
            </ng-container>
          </ng-container>
        </mat-menu>
      </ng-container>
    </nav>

    <ng-template #fallback>
      <nav class="menu-bar"></nav>
    </ng-template>
  `,
  styles: [`
    .menu-bar {
      display: flex;
      gap: .25rem;
      padding: .25rem .5rem;
      border-top: 1px solid rgba(0,0,0,.06);
      border-bottom: 1px solid rgba(0,0,0,.06);
      background: #fff;
    }
  `]
})
export class DynamicMenuComponent {
  private menuSvc = inject(MenuService);
  tree: MenuNode[] = [];

  constructor() {
    this.menuSvc.getTree().subscribe(t => {
      this.tree = (t ?? []).filter(x => x.isEnabled || x.children.length > 0);
    });
  }

  trackById = (_: number, n: MenuNode) => n.id;
}
