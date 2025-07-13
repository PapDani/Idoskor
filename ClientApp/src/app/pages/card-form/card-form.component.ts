import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardService } from '../../services/card.service';

@Component({
  selector: 'app-card-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './card-form.component.html',
  styleUrls: ['./card-form.component.scss']
})
export class CardFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  cardId?: number;
    fileControl!: HTMLInputElement;
    http: any;

  constructor(
    private fb: FormBuilder,
    private service: CardService,
    private route: ActivatedRoute,
    private router: Router
  ) {

    this.form = this.fb.group({
      title: ['', Validators.required],
      imageUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\//)]],
      contentUrl: ['', [Validators.required, Validators.pattern(/^\/.+/)]]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.cardId = +idParam;
      this.service.getCard(this.cardId).subscribe(card => {
        this.form.patchValue(card);
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const fd = new FormData();
    fd.append('title', this.form.value.title);
    fd.append('contentUrl', this.form.value.contentUrl);
    if (this.fileControl.files?.length) {
      fd.append('imageFile', this.fileControl.files[0]);
    }

    const obs = this.isEdit
      ? this.http.put(`/api/Cards/${this.cardId}`, fd)
      : this.http.post(`/api/Cards`, fd);

    obs.subscribe(() => this.router.navigate(['/cards']));
  }

  onDelete(): void {
    if (this.isEdit && this.cardId != null) {
      this.service.deleteCard(this.cardId)
        .subscribe(() => this.router.navigate(['/cards']));
    }
  }

  onFileSelected(evt: Event) {
    this.fileControl = evt.target as HTMLInputElement;
  }
}
