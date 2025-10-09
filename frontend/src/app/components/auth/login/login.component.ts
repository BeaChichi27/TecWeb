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

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Verifica se l'utente arriva dalla registrazione
    this.route.queryParams.subscribe(params => {
      if (params['registered'] === 'true') {
        this.successMessage = 'Registrazione completata! Effettua il login.';
        
        // Rimuovi il parametro dall'URL
        this.router.navigate(
          [], 
          {
            relativeTo: this.route,
            queryParams: {},
            replaceUrl: true
          }
        );
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    const { username, password } = this.loginForm.value;
    
    this.authService.login(username, password).subscribe({
      next: () => {
        /* Dopo il login riuscito, verifico se esiste un URL di ritorno.
           Se l'utente è stato reindirizzato dall'auth guard, uso quell'URL,
           altrimenti lo mando alla pagina principale dei ristoranti.
        */
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/restaurants';
        
        // Uso navigateByUrl perché returnUrl è già un percorso completo
        this.router.navigateByUrl(returnUrl);
      },
      error: (errorMessage: string) => {
        /* Gestisco l'errore ricevuto dall'AuthService.
           Grazie al pattern di gestione centralizzata degli errori,
           ricevo direttamente una stringa leggibile dall'utente.
        */
        this.errorMessage = errorMessage;
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}