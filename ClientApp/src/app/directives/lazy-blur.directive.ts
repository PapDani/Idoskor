import { AfterViewInit, Directive, ElementRef, HostBinding, HostListener } from '@angular/core';

@Directive({
  selector: 'img[lazyBlur]',
  standalone: true,
})
export class LazyBlurDirective implements AfterViewInit {
  @HostBinding('class.is-loading') isLoading = true;

  constructor(private el: ElementRef<HTMLImageElement>) { }

  ngAfterViewInit() {
    const img = this.el.nativeElement;
    img.loading = 'lazy';
    img.decoding = 'async';

    // Cache-ből jövő kép esetére: azonnal vedd le a blur-t
    if (img.complete && img.naturalWidth > 0) {
      img.decode?.().catch(() => { }).finally(() => this.markLoaded());
    }
  }

  @HostListener('load') onLoad() { this.markLoaded(); }
  @HostListener('error') onError() { this.markLoaded(); } // ne maradjon örökre homályos

  private markLoaded() {
    this.isLoading = false;
    const img = this.el.nativeElement;
    img.classList.add('is-loaded');
    img.classList.remove('is-loading');
  }
}
