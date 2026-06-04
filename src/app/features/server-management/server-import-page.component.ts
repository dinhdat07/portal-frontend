import { Component, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ServersApiService } from '../../core/api/servers-api.service';
import { getErrorMessage } from '../../core/api/api.types';
import { ImportResult } from '../../core/models/server.models';

@Component({
  selector: 'app-server-import-page',
  imports: [RouterLink, NgIf, NgFor],
  template: `
    <div class="stack-lg">
      <section class="page-head">
        <div>
          <p class="eyebrow">Infrastructure</p>
          <h1>Import Servers</h1>
          <p>Upload an Excel file (.xlsx) to bulk-register servers.</p>
        </div>
      </section>

      <div class="alert alert-danger" *ngIf="errorMessage()">{{ errorMessage() }}</div>
      <div class="alert alert-success" *ngIf="importResult()">
        Import complete: {{ importResult()!.success_count }} succeeded, {{ importResult()!.failure_count }} failed out of {{ importResult()!.total_rows }} rows.
      </div>

      <article class="panel section-card" *ngIf="!importResult()">
        <div class="stack">
          <p>Expected columns: <strong>server_name</strong>, <strong>ipv4</strong></p>
          <label class="field">
            <span>Excel File (.xlsx)</span>
            <input type="file" accept=".xlsx" (change)="onFileSelected($event)" [disabled]="isUploading()" />
          </label>
          <div class="btn-row">
            <button class="btn btn-primary" [disabled]="!selectedFile() || isUploading()" (click)="upload()">
              {{ isUploading() ? 'Uploading...' : 'Upload & Import' }}
            </button>
            <a class="btn btn-secondary" routerLink="/servers/inventory">Cancel</a>
          </div>
        </div>
      </article>

      <article class="panel section-card" *ngIf="importResult()?.failures?.length">
        <h2>Import Failures</h2>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Row</th>
                <th>Server Name</th>
                <th>IPv4</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let f of importResult()!.failures">
                <td>{{ f.row }}</td>
                <td>{{ f.server_name }}</td>
                <td><code>{{ f.ipv4 }}</code></td>
                <td>{{ f.reason }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <div class="btn-row" *ngIf="importResult()">
        <a class="btn btn-primary" routerLink="/servers/inventory">View Server Inventory</a>
        <button class="btn btn-secondary" (click)="resetImport()">Import Another File</button>
      </div>
    </div>
  `,
})
export class ServerImportPageComponent {
  readonly selectedFile = signal<File | null>(null);
  readonly isUploading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly importResult = signal<ImportResult | null>(null);

  constructor(private readonly serversApi: ServersApiService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB

      if (!file.name.toLowerCase().endsWith('.xlsx')) {
        this.errorMessage.set('Only .xlsx files are allowed.');
        input.value = '';
        return;
      }

      if (file.size > MAX_SIZE) {
        this.errorMessage.set('File must be smaller than 5MB.');
        input.value = '';
        return;
      }

      if (file.type && file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        this.errorMessage.set('Invalid file format. Please upload a valid .xlsx file.');
        input.value = '';
        return;
      }

      this.selectedFile.set(file);
      this.errorMessage.set(null);
    }
  }

  upload(): void {
    const file = this.selectedFile();
    if (!file) {
      this.errorMessage.set('Please select a file.');
      return;
    }

    this.isUploading.set(true);
    this.errorMessage.set(null);

    this.serversApi.importServers(file).subscribe({
      next: (result) => {
        this.importResult.set(result);
        this.isUploading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(getErrorMessage(err));
        this.isUploading.set(false);
      },
    });
  }

  resetImport(): void {
    this.selectedFile.set(null);
    this.importResult.set(null);
    this.errorMessage.set(null);
  }
}
