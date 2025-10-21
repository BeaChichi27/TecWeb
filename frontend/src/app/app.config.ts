import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes), 
    
    /* Configurazione dell'HttpClient per usare l'Interceptor.
       Il metodo withInterceptors registra la funzione authInterceptor, 
       rendendola attiva per tutte le richieste HTTP.
    */
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};
