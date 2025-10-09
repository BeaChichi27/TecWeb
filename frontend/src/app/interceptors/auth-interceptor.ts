import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  /* Uso inject() per ottenere i servizi necessari all'interno 
     della funzione Interceptor.
  */
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.token;

  /* Se un token è presente nel servizio di autenticazione, 
     clono la richiesta e aggiungo l'header Authorization 
     con il formato "Bearer [token]".
  */
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    /* Gestione degli errori centralizzata: 
       Se il backend ritorna uno stato 401 (Non Autorizzato), 
       significa che il token è scaduto o non valido.
       Eseguo il logout e reindirizzo al login.
    */
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};