import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  errorMessage = '';
  loading = false;
  showPassword = false;
  showConfirmPassword = false;
  returnUrl = '';
  
  /* 
   * Requisiti per la password che mostro all'utente
   * per aiutarlo a creare una password sicura
   */
  passwordRequirements = {
    minLength: false,
    hasLetter: false,
    hasNumber: false,
    match: false
  };
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Easter egg nascosto, visibile solo nella console del browser in quanto lavoratrice di Glovo
    console.log("ABBASSO GLOVO");
    
    /* 
     * Creo il form di registrazione con validazione integrata.
     * Uso i validator di Angular per garantire che tutti i campi rispettino
     * i requisiti minimi di sicurezza e formato.
     */
    this.registerForm = this.fb.group({
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern(/^[a-zA-Z0-9_]+$/) // Solo lettere, numeri e underscore
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/) // Almeno una lettera e un numero
      ]],
      confirmPassword: ['', [
        Validators.required
      ]],
      acceptTerms: [false, [Validators.requiredTrue]] // L'utente deve accettare i termini
    }, {
      validators: this.passwordMatchValidator
    });

    /* 
     * Verifico i cambiamenti della password per aggiornare in tempo reale
     * gli indicatori dei requisiti di sicurezza
     */
    this.registerForm.get('password')?.valueChanges.subscribe(password => {
      this.updatePasswordRequirements(password);
    });

    this.registerForm.get('confirmPassword')?.valueChanges.subscribe(() => {
      this.updatePasswordMatch();
    });
  }

  ngOnInit(): void {
    /* 
     * Salvo l'URL di ritorno se presente nei query params,
     * per reindirizzare l'utente dopo la registrazione
     */
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/restaurants';

    /* 
     * Se l'utente è già autenticato, lo reindirizzo direttamente
     * alla destinazione prevista
     */
    if (this.authService.isLoggedIn) {
      this.router.navigateByUrl(this.returnUrl);
    }
  }

  /* 
   * Validatore personalizzato per verificare che password e conferma password
   * coincidano. 
   */
  private passwordMatchValidator(formGroup: AbstractControl): ValidationErrors | null {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }

  /* 
   * Aggiorno gli indicatori visivi dei requisiti della password
   * in tempo reale mentre l'utente digita
   */
  private updatePasswordRequirements(password: string): void {
    this.passwordRequirements.minLength = password.length >= 6;
    this.passwordRequirements.hasLetter = /[A-Za-z]/.test(password);
    this.passwordRequirements.hasNumber = /\d/.test(password);
    this.updatePasswordMatch();
  }

  /* 
   * Verifico se le password corrispondono
   */
  private updatePasswordMatch(): void {
    const password = this.registerForm.get('password')?.value;
    const confirmPassword = this.registerForm.get('confirmPassword')?.value;
    this.passwordRequirements.match = confirmPassword && password === confirmPassword;
  }

  /* 
   * Gestisco l'invio del form di registrazione.
   * Verifico la validità, mostro lo spinner e invio i dati al servizio.
   */
  onSubmit(): void {
    /* 
     * Se il form non è valido, marco tutti i campi come "touched"
     * per mostrare i messaggi di errore all'utente
     */
    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    
    const { username, email, password } = this.registerForm.value;
    
    /* 
     * Invio la richiesta di registrazione al backend.
     * Tutti gli utenti possono creare ristoranti.
     * Se ha successo, reindirizzo l'utente alla pagina di login
     * con un messaggio di conferma.
     */
    this.authService.register(username, email, password, true).subscribe({
      next: () => {
        /* 
         * Registrazione completata con successo!
         * Reindirizzo alla pagina di login con un messaggio di conferma
         * e passo l'URL di ritorno per facilitare il login successivo.
         */
        this.router.navigate(['/login'], { 
          queryParams: { 
            registered: 'true',
            returnUrl: this.returnUrl !== '/restaurants' ? this.returnUrl : null
          } 
        });
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
   * Toggle per mostrare/nascondere la conferma password
   */
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  /* 
   * Pulisco i messaggi di errore quando l'utente inizia a digitare.
   */
  clearMessages(): void {
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }

  /* 
   * Utility per ottenere facilmente i messaggi di errore per i campi del form.
   * Uso questo metodo nel template per mostrare feedback appropriati all'utente.
   */
  getErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);
    
    if (!control || !control.errors || !control.touched) {
      return '';
    }
    
    if (control.errors['required']) {
      return 'Questo campo è obbligatorio';
    }
    
    if (control.errors['minlength']) {
      const requiredLength = control.errors['minlength'].requiredLength;
      return `Minimo ${requiredLength} caratteri`;
    }

    if (control.errors['maxlength']) {
      const requiredLength = control.errors['maxlength'].requiredLength;
      return `Massimo ${requiredLength} caratteri`;
    }
    
    if (control.errors['email']) {
      return 'Inserisci un indirizzo email valido';
    }
    
    if (control.errors['pattern']) {
      if (controlName === 'username') {
        return 'Solo lettere, numeri e underscore sono permessi';
      }
      if (controlName === 'password') {
        return 'La password deve contenere almeno una lettera e un numero';
      }
    }
    
    return 'Campo non valido';
  }

  /* 
   * Verifico se le password inserite non corrispondono.
   * Mostro un messaggio di errore appropriato solo quando entrambi i campi
   * sono stati compilati.
   */
  passwordsDoNotMatch(): boolean {
    const form = this.registerForm;
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    return !!(
      password?.value && 
      confirmPassword?.value && 
      confirmPassword.touched &&
      form.errors?.['passwordsMismatch']
    );
  }

  /* 
   * Calcolo la forza della password per mostrare un indicatore visivo
   * che aiuta l'utente a creare password più sicure
   */
  getPasswordStrength(): { strength: number; label: string; color: string } {
    const password = this.registerForm.get('password')?.value || '';
    let strength = 0;

    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*#?&]/.test(password)) strength++;

    if (strength <= 2) {
      return { strength: 33, label: 'Debole', color: '#ef4444' };
    } else if (strength <= 4) {
      return { strength: 66, label: 'Media', color: '#f59e0b' };
    } else {
      return { strength: 100, label: 'Forte', color: '#22c55e' };
    }
  }

  /* Getter per accedere facilmente ai controlli del form nel template */
  get usernameControl() { 
    return this.registerForm.get('username'); 
  }

  get emailControl() { 
    return this.registerForm.get('email'); 
  }

  get passwordControl() { 
    return this.registerForm.get('password'); 
  }

  get confirmPasswordControl() { 
    return this.registerForm.get('confirmPassword'); 
  }

  get acceptTermsControl() { 
    return this.registerForm.get('acceptTerms'); 
  }
}