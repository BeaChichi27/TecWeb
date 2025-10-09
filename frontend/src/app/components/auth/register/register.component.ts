import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage = '';
  loading = false;
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    /* Creo il form di registrazione con validazione integrata.
       Uso i validator di Angular per garantire che tutti i campi rispettino
       i requisiti minimi di sicurezza e formato.
    */
    this.registerForm = this.fb.group({
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20)
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/) // Almeno una lettera e un numero
      ]],
      confirmPassword: ['', [
        Validators.required
      ]]
    }, {
      validators: (formGroup: AbstractControl): ValidationErrors | null => {
        const password = formGroup.get('password')?.value;
        const confirmPassword = formGroup.get('confirmPassword')?.value;
        
        return password === confirmPassword ? null : { passwordsMismatch: true };
      }
    });
  }
  
  /* Gestisce l'invio del form di registrazione.
     Invia i dati al server tramite AuthService e gestisce sia il successo che l'errore.
  */
  onSubmit(): void {
    if (this.registerForm.invalid) {
      // Marco tutti i campi come touched per mostrare gli errori di validazione
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    
    const { username, email, password } = this.registerForm.value;
    
    this.authService.register(username, email, password).subscribe({
      next: () => {
        /* Registrazione completata con successo, reindirizzo alla pagina di login
           con un messaggio di conferma.
        */
        this.router.navigate(['/login'], { 
          queryParams: { registered: 'true' } 
        });
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
  
  /* Utility per ottenere facilmente i messaggi di errore per i campi del form.
     Uso questo metodo nel template per mostrare feedback appropriati all'utente.
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
      return `Minimo ${control.errors['minlength'].requiredLength} caratteri`;
    }
    
    if (control.errors['email']) {
      return 'Inserisci un indirizzo email valido';
    }
    
    if (control.errors['pattern']) {
      return 'La password deve contenere almeno una lettera e un numero';
    }
    
    return 'Campo non valido';
  }
  
  /* Verifica se le password inserite non corrispondono.
     Mostro un messaggio di errore appropriato solo quando entrambi i campi
     sono stati compilati.
  */
  passwordsDoNotMatch(): boolean {
    const passwordControl = this.registerForm.get('password');
    const confirmControl = this.registerForm.get('confirmPassword');
    
    if (!passwordControl?.touched || !confirmControl?.touched) {
      return false;
    }
    
    return passwordControl.value !== confirmControl.value;
  }
}