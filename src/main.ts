import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appRuntimeConfig } from './app/app.config';

bootstrapApplication(AppComponent, appRuntimeConfig).catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
});
