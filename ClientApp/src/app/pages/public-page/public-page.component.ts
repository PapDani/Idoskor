import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PageService } from '../../services/page.service';


  @Component({
 selector: 'app-public-page',
      standalone: true,
      imports: [CommonModule],
      template: `<div class="container mx-auto p-4" [innerHTML]="html"></div>`
  })
  export class PublicPageComponent implements OnInit {
  html = '';
  constructor(private route: ActivatedRoute, private ps: PageService) { }
  ngOnInit() {
      // pl. /about, /programs… az első path szegmens a key
        const key = this.route.snapshot.routeConfig?.path ?? '';
      if (!key) return;
      this.ps.get(key).subscribe(p => this.html = p.content ?? '');
    }
}
