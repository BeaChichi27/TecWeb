import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export function authGuard(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
  const authService = inject(AuthService);
  const router = inject(Router);

  /* Verifico se l'utente è autenticato utilizzando il metodo isLoggedIn
     dell'AuthService. Questo metodo controlla la presenza del token e dell'utente.
  */
  if (authService.isLoggedIn) {
    // Se l'utente è autenticato, consento l'accesso alla rotta
    return true;
  }

  /* Se l'utente non è autenticato, lo reindirizzo alla pagina di login
     e salvo l'URL a cui stava tentando di accedere come parametro.
     Questo permetterà di reindirizzarlo alla pagina originale dopo il login.
  */
  return router.createUrlTree(['/login'], { 
    queryParams: { returnUrl: state.url } 
  });
}