import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCardListComponent } from './admin-card-list.component';

describe('AdminCardListComponent', () => {
  let component: AdminCardListComponent;
  let fixture: ComponentFixture<AdminCardListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCardListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCardListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
