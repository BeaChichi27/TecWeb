import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import { config } from './app/app.config.server';

export default bootstrap;

export function bootstrap() {
  return bootstrapApplication(AppComponent, config);
}
