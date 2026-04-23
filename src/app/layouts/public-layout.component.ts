import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet],
  template: `
    <div class="public-shell">
      <div class="public-grid">
        <section class="public-side">
          <div class="public-side-top">
            <span class="pill">Portal System</span>
            <div>
              <h1>Manage your account and team access in one place.</h1>
              <p>
                Sign in, update your profile, and manage users with a clean and simple workflow.
              </p>
            </div>
          </div>
          <div class="public-side-cards">
            <article>
              <h3>Simple account tools</h3>
              <p>Create your account, verify email, and keep your profile up to date.</p>
            </article>
            <article>
              <h3>Built for admins</h3>
              <p>Search users, review details, and manage access safely.</p>
            </article>
          </div>
        </section>

        <section class="public-content">
          <div class="auth-card-wrap">
            <router-outlet></router-outlet>
          </div>
        </section>
      </div>
    </div>
  `,
})
export class PublicLayoutComponent {}
