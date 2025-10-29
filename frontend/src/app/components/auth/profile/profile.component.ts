import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { RestaurantService } from '../../../services/restaurant.service';
import { ReviewService } from '../../../services/review.service';
import { User } from '../../../models/user.model';
import { Restaurant } from '../../../models/restaurant.model';
import { Review } from '../../../models/review.model';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  passwordForm!: FormGroup;
  
  loading = false;
  errorMessage = '';
  successMessage = '';
  
  // Statistiche utente
  userRestaurants: Restaurant[] = [];
  userReviews: Review[] = [];
  restaurantsCount = 0;
  reviewsCount = 0;
  
  // Gestione tab
  activeTab: 'restaurants' | 'reviews' = 'restaurants';
  showNoReviewsPopup = false;

  // Modalità di modifica password
  isChangingPassword = false;
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private restaurantService: RestaurantService,
    private reviewService: ReviewService,
    private router: Router
  ) {
    
    console.log("ABBASSO GLOVO");
  }
  
  /* 
   * All'inizializzazione, recupero i dati dell'utente corrente dal servizio
   * di autenticazione e creo i form per la modifica del profilo e della password.
   * Carico anche le statistiche dell'utente (ristoranti e recensioni create).
   */
  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Creo i form
    this.createForms();
    
    // Carico le statistiche dell'utente
    this.loadUserStatistics();
  }
  
  /* 
   * Creo il form reattivo per il cambio password.
   * Il form password include la conferma della nuova password.
   */
  private createForms(): void {
    // Form per cambiare la password
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }
  
  /* 
   * Validatore personalizzato per verificare che la nuova password e 
   * la conferma password coincidano. Questo validatore opera a livello
   * di FormGroup per confrontare i due campi.
   */
  private passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }
  
  /* 
   * Carico le statistiche dell'utente: il numero e la lista dei ristoranti
   * creati e delle recensioni scritte. Queste informazioni vengono mostrate
   * nel profilo per dare all'utente una panoramica della sua attività.
   */
  private loadUserStatistics(): void {
    if (!this.currentUser) return;
    
    this.loading = true;
    
    // Carico i ristoranti dell'utente
    this.restaurantService.getRestaurantsByOwner(this.currentUser.id)
      .subscribe({
        next: (response) => {
          this.userRestaurants = response.restaurants || [];
          this.restaurantsCount = response.total || 0;
        },
        error: (error) => {
          console.error('Errore nel caricamento dei ristoranti:', error);
        }
      });
    
    // Carico le recensioni dell'utente
    this.reviewService.getUserReviews(this.currentUser.id)
      .subscribe({
        next: (response) => {
          this.userReviews = response.reviews || [];
          this.reviewsCount = response.total || 0;
          this.loading = false;
        },
        error: (error) => {
          console.error('Errore nel caricamento delle recensioni:', error);
          this.loading = false;
        }
      });
  }
  
  /* 
   * Abilito la modalità di cambio password mostrando il form dedicato.
   */
  enablePasswordChange(): void {
    this.isChangingPassword = true;
    this.passwordForm.reset();
  }
  
  /* 
   * Annullo il cambio password nascondendo il form e resettando i campi.
   */
  cancelPasswordChange(): void {
    this.isChangingPassword = false;
    this.passwordForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
  }
  
  /* 
   * Cambio la password dell'utente verificando prima che la password
   * corrente sia corretta e che la nuova password rispetti i requisiti.
   * Se tutto va a buon fine, mostro un messaggio di conferma.
   */
  changePassword(): void {
    if (this.passwordForm.invalid) {
      Object.keys(this.passwordForm.controls).forEach(key => {
        this.passwordForm.get(key)?.markAsTouched();
      });
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    const passwordData = {
      currentPassword: this.passwordForm.get('currentPassword')?.value,
      newPassword: this.passwordForm.get('newPassword')?.value
    };
    
    this.authService.changePassword(passwordData).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Password cambiata con successo!';
        this.isChangingPassword = false;
        this.passwordForm.reset();
        
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        this.errorMessage = error;
        this.loading = false;
      }
    });
  }
  
  /* 
   * Cambio la scheda attiva nel profilo per mostrare diverse sezioni:
   * ristoranti creati o recensioni scritte.
   */
  switchTab(tab: 'restaurants' | 'reviews'): void {
    if (tab === 'reviews' && this.reviewsCount === 0) {
      this.showNoReviewsPopup = true;
      return; 
    }

    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
  }

  /* 
   * Chiudo il popup per "Nessuna Recensione".
   */
  closeNoReviewsPopup(): void {
    this.showNoReviewsPopup = false;
  }
  
  /* 
   * Elimino l'account dell'utente dopo aver chiesto una conferma.
   * Questa è un'azione irreversibile che rimuove tutti i dati dell'utente.
   */
  deleteAccount(): void {
    const confirmation = confirm(
      'Sei sicuro di voler eliminare il tuo account? ' +
      'Questa azione è irreversibile e comporterà la perdita di tutti i tuoi dati, ' +
      'inclusi ristoranti e recensioni.'
    );
    
    if (!confirmation) return;
    
    const secondConfirmation = confirm(
      'Ultima conferma: vuoi davvero eliminare il tuo account?'
    );
    
    if (!secondConfirmation) return;
    
    this.loading = true;
    
    this.authService.deleteAccount().subscribe({
      next: () => {
        this.loading = false;
        alert('Il tuo account è stato eliminato con successo.');
        this.authService.logout();
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.errorMessage = error;
        this.loading = false;
      }
    });
  }
  
  /* 
   * Formatto la data in un formato leggibile.
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  /* Getter per accedere facilmente ai controlli del form nel template */
  get currentPasswordControl() { return this.passwordForm.get('currentPassword'); }
  get newPasswordControl() { return this.passwordForm.get('newPassword'); }
  get confirmPasswordControl() { return this.passwordForm.get('confirmPassword'); }
}
