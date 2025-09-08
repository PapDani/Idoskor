import { AfterViewInit, Directive, ElementRef, Input, OnDestroy } from '@angular/core';

@Directive({
  standalone: true,
  selector: 'img[appLazyImage]'
})
export class LazyImageDirective implements AfterViewInit, OnDestroy {
  @Input('appLazyImage') src!: string;
  private ob?: IntersectionObserver;

  constructor(private el: ElementRef<HTMLImageElement>) { }

  ngAfterViewInit(): void {
    const img = this.el.nativeElement;
    img.loading = 'lazy';
    (img as any).decoding = 'async';
    img.classList.add('lazy-img');

    const load = () => img.classList.add('loaded');
    img.addEventListener('load', load, { once: true });

    if ('IntersectionObserver' in window) {
      this.ob = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          img.src = this.src;
          this.ob?.disconnect();
        }
      }, { rootMargin: '200px' });
      this.ob.observe(img);
    } else {
      img.src = this.src;
    }
  }

  ngOnDestroy(): void {
    this.ob?.disconnect();
  }
}
