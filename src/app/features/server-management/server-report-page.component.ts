import { Component, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReportsApiService } from '../../core/api/reports-api.service';
import { getErrorMessage } from '../../core/api/api.types';

@Component({
  selector: 'app-server-report-page',
  imports: [ReactiveFormsModule, RouterLink, NgIf],
  template: `
    <div class="stack-lg">
      <section class="page-head">
        <div>
          <p class="eyebrow">Infrastructure</p>
          <h1>Uptime Reports</h1>
          <p>Generate on-demand server uptime reports delivered to your email.</p>
        </div>
      </section>

      <div class="alert alert-danger" *ngIf="errorMessage()">{{ errorMessage() }}</div>
      <div class="alert alert-success" *ngIf="successMessage()">{{ successMessage() }}</div>

      <article class="panel section-card">
        <form class="stack" [formGroup]="form" (ngSubmit)="submit()">
          <div class="grid-cols-2">
            <label class="field">
              <span>Start Date <span class="required">*</span></span>
              <input type="date" formControlName="startDate" />
            </label>
            <label class="field">
              <span>End Date <span class="required">*</span></span>
              <input type="date" formControlName="endDate" />
            </label>
          </div>

          <label class="field">
            <span>Recipient Email <span class="required">*</span></span>
            <input type="email" formControlName="targetEmail" placeholder="admin@example.com" />
            <span class="field-error" *ngIf="form.controls.targetEmail.touched && form.controls.targetEmail.hasError('email')">Enter a valid email address.</span>
          </label>

          <div class="btn-row">
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || isSubmitting()">
              {{ isSubmitting() ? 'Generating...' : 'Generate Report' }}
            </button>
          </div>
        </form>
      </article>
    </div>
  `,
})
export class ServerReportPageComponent {
  readonly form = this.fb.group({
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    targetEmail: ['', [Validators.required, Validators.email]],
  });

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  constructor(
    private readonly fb: NonNullableFormBuilder,
    private readonly reportsApi: ReportsApiService,
  ) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const raw = this.form.getRawValue();
    this.reportsApi.requestReport({
      start_date: raw.startDate,
      end_date: raw.endDate,
      target_email: raw.targetEmail,
    }).subscribe({
      next: (response) => {
        this.successMessage.set(response.message || 'Report request submitted. You will receive an email shortly.');
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.errorMessage.set(getErrorMessage(err));
        this.isSubmitting.set(false);
      },
    });
  }
}
