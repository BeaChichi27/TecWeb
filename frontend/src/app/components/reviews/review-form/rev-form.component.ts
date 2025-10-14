import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Review, CreateReviewDto, UpdateReviewDto } from '../../../models/review.model';
import { ReviewService } from '../../../services/review.service';
import { AuthService } from '../../../services/auth.service';
import { RestaurantService } from '../../../services/restaurant.service';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading';
import { switchMap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-rev-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    RouterModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './rev-form.component.html',
  styleUrls: ['./rev-form.component.scss']
})
export class RevFormComponent implements OnInit {
  // Permette di usare il componente sia inline che come pagina separata
  @Input() restaurantId?: number;
  @Output() reviewSubmitted = new EventEmitter<Review>();
  
  reviewForm!: FormGroup;
  isEditMode = false;
  reviewId?: number;
  loading = false;
  errorMessage = '';
  successMessage = '';
  restaurantName = '';
  maxRating = 5; // Per generare l'array di stelle
  
  // Suggerimenti divertenti per ispirare recensioni umoristiche
  funnyPrompts = [
    'Hai trovato alieni nella cucina?',
    'Il cameriere era un robot travestito?',
    'La pasta aveva poteri magici?',
    'Il tiramisù ti ha fatto levitare?',
    'La pizza parlava lingue straniere?'
  ];
  
  // Seleziona casualmente un suggerimento
  randomPrompt = this.funnyPrompts[Math.floor(Math.random() * this.funnyPrompts.length)];
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private reviewService: ReviewService,
    private authService: AuthService,
    private restaurantService: RestaurantService
  ) {}
  
  /* 
   * Quando vengo inizializzato, controllo che l'utente sia loggato e lo reindirizzo
   * al login se necessario. Creo il form per la recensione e determino se siamo
   * in modalità modifica o creazione controllando i parametri dell'URL.
   * Se ho un ID, carico la recensione esistente; altrimenti cerco l'ID del ristorante
   * per il quale creare una recensione e ne carico i dettagli.
   */
  ngOnInit(): void {
    if (!this.authService.isLoggedIn) {
      // Reindirizza al login se l'utente non è autenticato
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: this.router.url } 
      });
      return;
    }
    
    // Inizializza il form
    this.createForm();
    
    // Determina la modalità (creazione o modifica)
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        
        // Se c'è un ID nella URL, siamo in modalità modifica
        if (id) {
          this.isEditMode = true;
          this.reviewId = +id;
          this.loading = true;
          
          return this.reviewService.getReviewById(+id).pipe(
            catchError(error => {
              this.errorMessage = error;
              this.loading = false;
              return of(null);
            })
          );
        }
        
        // Altrimenti, siamo in modalità creazione
        // Controlla se il restaurantId è stato fornito come parametro
        if (!this.restaurantId) {
          const restId = this.route.snapshot.queryParamMap.get('restaurantId');
          if (restId) {
            this.restaurantId = +restId;
          } else {
            this.errorMessage = 'Nessun ristorante specificato per la recensione.';
            return of(null);
          }
        }
        
        // Carica il nome del ristorante per migliorare l'UX
        if (this.restaurantId) {
          this.loading = true;
          return this.restaurantService.getRestaurantById(this.restaurantId).pipe(
            catchError(error => {
              this.errorMessage = error;
              this.loading = false;
              return of(null);
            })
          );
        }
        
        return of(null);
      })
    ).subscribe(result => {
      this.loading = false;
      
      if (!result) return;
      
      if ('rating' in result) {
        // È una recensione, popoliamo il form per la modifica
        const review = result as Review;
        this.populateForm(review);
        this.restaurantId = review.restaurantId;
        
        // Carica il nome del ristorante
        this.loadRestaurantName(review.restaurantId);
        
        // Verifica che l'utente corrente sia l'autore
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser || currentUser.id !== review.userId) {
          this.errorMessage = 'Non sei autorizzato a modificare questa recensione.';
          this.reviewForm.disable();
        }
      } else {
        // È un ristorante, prendiamo solo il nome
        const restaurant = result;
        this.restaurantName = restaurant.name;
      }
    });
  }
  
  /* 
   * Creo il form con i controlli necessari per la valutazione e il contenuto.
   * Imposto le validazioni per garantire che l'utente inserisca valori corretti:
   * - Rating: obbligatorio, tra 1 e 5
   * - Contenuto: obbligatorio, tra 20 e 1000 caratteri
   */
  private createForm(): void {
    this.reviewForm = this.fb.group({
      rating: [null, [Validators.required, Validators.min(1), Validators.max(5)]],
      content: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]]
    });
  }
  
  /* 
   * Inserisco i dati della recensione esistente nei rispettivi campi del form.
   * Questo mi permette di mostrare all'utente i valori attuali quando modifica
   * una recensione già pubblicata.
   */
  private populateForm(review: Review): void {
    this.reviewForm.patchValue({
      rating: review.rating,
      content: review.content
    });
  }
  
  /* 
   * Recupero il nome del ristorante usando il suo ID per migliorare l'esperienza 
   * utente. Mostrando il nome del ristorante, l'utente sa per quale locale
   * sta scrivendo la recensione.
   */
  private loadRestaurantName(restaurantId: number): void {
    this.restaurantService.getRestaurantById(restaurantId).subscribe({
      next: (restaurant) => {
        this.restaurantName = restaurant.name;
      },
      error: (error) => {
        console.error('Errore nel caricamento del ristorante:', error);
      }
    });
  }
  
  /* 
   * Aggiorno il valore del rating nel form quando l'utente clicca su una stella.
   * Questo metodo viene chiamato dal template quando l'utente interagisce con
   * il sistema di valutazione a stelle.
   */
  setRating(rating: number): void {
    this.reviewForm.patchValue({ rating });
  }
  
  /* 
   * Gestisco l'invio del form verificando prima la validità dei dati inseriti.
   * Se il form è valido, determino se siamo in modalità modifica o creazione
   * e chiamo il servizio appropriato. Dopo il salvataggio, mostro un messaggio
   * di successo e reindirizzo l'utente o emetto un evento di completamento.
   */
  onSubmit(): void {
    if (this.reviewForm.invalid) {
      // Marca tutti i campi come touched per mostrare gli errori
      Object.keys(this.reviewForm.controls).forEach(key => {
        const control = this.reviewForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    
    const formValue = this.reviewForm.value;
    
    if (this.isEditMode && this.reviewId) {
      // Modalità modifica
      const updateData: UpdateReviewDto = {
        rating: formValue.rating,
        content: formValue.content
      };
      
      this.reviewService.updateReview(this.reviewId, updateData).subscribe({
        next: (review) => {
          this.loading = false;
          this.successMessage = 'La tua recensione è stata aggiornata con successo!';
          
          // Emetti l'evento di completamento
          this.reviewSubmitted.emit(review);
          
          // Reindirizza alla pagina del ristorante dopo un breve ritardo
          setTimeout(() => {
            this.router.navigate(['/restaurants', review.restaurantId]);
          }, 1500);
        },
        error: (error) => {
          this.errorMessage = error;
          this.loading = false;
        }
      });
    } else {
      // Modalità creazione
      if (!this.restaurantId) {
        this.errorMessage = 'ID del ristorante mancante.';
        this.loading = false;
        return;
      }
      
      const createData: CreateReviewDto = {
        restaurantId: this.restaurantId,
        rating: formValue.rating,
        content: formValue.content
      };
      
      this.reviewService.createReview(createData).subscribe({
        next: (review) => {
          this.loading = false;
          this.successMessage = 'La tua recensione è stata pubblicata con successo!';
          this.reviewForm.reset();
          
          // Emetti l'evento di completamento
          this.reviewSubmitted.emit(review);
          
          // Se usato come componente standalone, reindirizza
          if (!this.router.url.includes('/restaurants/')) {
            setTimeout(() => {
              this.router.navigate(['/restaurants', review.restaurantId]);
            }, 1500);
          }
        },
        error: (error) => {
          this.errorMessage = error;
          this.loading = false;
        }
      });
    }
  }
  
  /* 
   * Fornisco un accesso semplificato al controllo del contenuto della recensione.
   * Utilizzo questo getter nel template per verificare la validità e mostrare 
   * gli eventuali messaggi di errore.
   */
  get contentControl() { return this.reviewForm.get('content'); }
  
  /* 
   * Fornisco un accesso semplificato al controllo del rating della recensione.
   * Utilizzo questo getter nel template per verificare la validità e mostrare 
   * gli eventuali messaggi di errore.
   */
  get ratingControl() { return this.reviewForm.get('rating'); }
  
  /* 
   * Creo un array di numeri da 1 a maxRating (5) che utilizzo nel template
   * per generare le stelle cliccabili del sistema di valutazione.
   */
  get ratingArray(): number[] {
    return Array(this.maxRating).fill(0).map((_, index) => index + 1);
  }
}