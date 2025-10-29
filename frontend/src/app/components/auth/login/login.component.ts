import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  returnUrl = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {

    console.log("ABBASSO GLOVO");
    
    /* 
     * Creo il form di login con validazione per username e password.
     * Entrambi i campi sono obbligatori per poter effettuare il login.
     */
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false] // Campo per ricordare l'utente
    });
  }

  /* 
   * All'inizializzazione, viene verificato se ci sono parametri nella query string:
   * - 'registered=true': l'utente arriva dalla registrazione, mostro un messaggio di successo
   * - 'returnUrl': l'utente è stato reindirizzato dall'auth guard, salvo l'URL di ritorno
   */
  ngOnInit(): void {
    // Salvo l'URL di ritorno se presente
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/restaurants';
    
    // Verifico se l'utente arriva dalla registrazione
    this.route.queryParams.subscribe(params => {
      if (params['registered'] === 'true') {
        this.successMessage = '✅ Registrazione completata con successo! Ora puoi effettuare il login.';
        
        /* 
         * Rimuovo il parametro dall'URL per evitare che il messaggio
         * riappaia se l'utente ricarica la pagina
         */
        this.router.navigate(
          [], 
          {
            relativeTo: this.route,
            queryParams: { returnUrl: this.returnUrl !== '/restaurants' ? this.returnUrl : null },
            queryParamsHandling: 'merge',
            replaceUrl: true
          }
        );
      }
    });

    /* 
     * Se l'utente è già autenticato, lo reindirizzo direttamente
     * alla destinazione prevista
     */
    if (this.authService.isLoggedIn) {
      this.router.navigateByUrl(this.returnUrl);
    }
  }

  /* 
   * Gestisco il submit del form di login.
   * Verifico la validità, mostro lo spinner e invio i dati al servizio di autenticazione.
   */
  onSubmit(): void {
    /* 
     * Se il form non è valido, marco tutti i campi come "touched"
     * per mostrare i messaggi di errore all'utente
     */
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    const { username, password, rememberMe } = this.loginForm.value;
    
    /* 
     * Invio la richiesta di login al backend.
     * Se ha successo, reindirizzo l'utente all'URL di ritorno o alla home.
     */
    this.authService.login(username, password).subscribe({
      next: () => {
        /* 
         * Col login riuscito mostro un messaggio di successo e reindirizzo
         * l'utente alla pagina che stava cercando di visitare, oppure
         * alla lista dei ristoranti come pagina predefinita.
         */
        this.successMessage = '✅ Login effettuato con successo!';
        
        // Piccolo delay per mostrare il messaggio di successo
        setTimeout(() => {
          this.router.navigateByUrl(this.returnUrl);
        }, 500);
      },
      error: (errorMessage: string) => {
        /* 
         * Gestisco l'errore ricevuto dall'AuthService.
         * Il servizio restituisce già un messaggio leggibile,
         * quindi lo mostro direttamente all'utente.
         */
        this.errorMessage = errorMessage;
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  /* 
   * Toggle per mostrare/nascondere la password.
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /* 
   * Pulisco i messaggi di errore quando l'utente inizia a digitare.
   */
  clearMessages(): void {
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }

  /* Getter per accedere facilmente ai controlli del form nel template */
  get usernameControl() { 
    return this.loginForm.get('username'); 
  }

  get passwordControl() { 
    return this.loginForm.get('password'); 
  }

  get rememberMeControl() { 
    return this.loginForm.get('rememberMe'); 
  }
}