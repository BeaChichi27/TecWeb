import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, forkJoin, of, switchMap, Subscription } from 'rxjs';
import { Restaurant } from '../../../models/restaurant.model';
import { Review } from '../../../models/review.model';
import { RestaurantService } from '../../../services/restaurant.service';
import { ReviewService } from '../../../services/review.service';
import { AuthService } from '../../../services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading';
import { User } from '../../../models/user.model';
import { VoteService } from '../../../services/vote.service';
@Component({
  selector: 'app-rest-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent],
  templateUrl: './rest-detail.component.html',
  styleUrls: ['./rest-detail.component.scss']
})
export class RestDetailComponent implements OnInit, OnDestroy {
  /* 
   * Dati del ristorante e recensioni
   */
  restaurant: Restaurant | null = null;
  reviews: Review[] = [];
  loading = true;
  errorMessage = '';
  successMessage = '';
  
  /* 
   * Autenticazione e permessi
   */
  currentUser: User | null = null;
  private userSubscription?: Subscription;
  isOwner = false;
  
  /* 
   * Paginazione e ordinamento recensioni
   */
  totalReviews = 0;
  currentPage = 1;
  reviewsPerPage = 10;
  sortBy: 'votes' | 'date' = 'votes';
  
  /* 
   * Stato UI
   */
  showDeleteConfirm = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private restaurantService: RestaurantService,
    private reviewService: ReviewService,
    private authService: AuthService,
    private voteService: VoteService
  ) {
    // Easter egg nascosto - visibile solo nella console del browser
    console.log("ABBASSO GLOVO");
  }

  ngOnInit(): void {
    /* 
     * Mi sottoscrivo all'utente corrente per gestire
     * i permessi di modifica/eliminazione
     */
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.checkOwnership();
    });
    
    /* 
     * Leggo l'ID del ristorante dall'URL e carico i dati.
     * Utilizzo forkJoin per caricare in parallelo il ristorante
     * e le sue recensioni, ottimizzando i tempi di caricamento.
     */
    this.route.paramMap.pipe(
      switchMap(params => {
        const restaurantId = Number(params.get('id'));
        
        /* 
         * Verifico che l'ID sia valido
         */
        if (isNaN(restaurantId) || restaurantId <= 0) {
          this.errorMessage = 'ID ristorante non valido';
          this.loading = false;
          return of(null);
        }
        
        this.loading = true;
        this.errorMessage = '';
        
        /* 
         * Carico in parallelo ristorante e recensioni
         * per ridurre i tempi di attesa
         */
        return forkJoin({
          restaurant: this.restaurantService.getRestaurantById(restaurantId).pipe(
            catchError(error => {
              console.error('Errore caricamento ristorante:', error);
              return of(null);
            })
          ),
          reviewsData: this.reviewService.getReviewsByRestaurant(
            restaurantId, 
            this.currentPage, 
            this.reviewsPerPage,
            this.sortBy
          ).pipe(
            catchError(error => {
              console.error('Errore caricamento recensioni:', error);
              return of({ reviews: [], total: 0 });
            })
          )
        });
      })
    ).subscribe(data => {
      if (!data) {
        this.loading = false;
        return;
      }
      
      if (!data.restaurant) {
        this.errorMessage = 'Ristorante non trovato. Potrebbe essere stato eliminato.';
        this.loading = false;
        return;
      }
      
      /* 
       * Assegno i dati caricati
       */
      this.restaurant = data.restaurant;
      this.reviews = data.reviewsData.reviews;
      this.totalReviews = data.reviewsData.total;
      
      /* 
       * Verifico se l'utente corrente è il proprietario
       */
      this.checkOwnership();
      
      this.loading = false;
      
      /* 
       * Verifico se c'è un messaggio di successo da mostrare
       * (es. dopo aver creato una recensione)
       */
      this.checkSuccessMessage();
    });
  }

  ngOnDestroy(): void {
    /* 
     * Pulisco le sottoscrizioni per evitare memory leak
     */
    this.userSubscription?.unsubscribe();
  }

  /* 
   * Verifico se l'utente corrente è il proprietario del ristorante
   */
  private checkOwnership(): void {
    this.isOwner = !!(
      this.restaurant && 
      this.currentUser && 
      this.restaurant.ownerId === this.currentUser.id
    );
  }

  /* 
   * Controllo se ci sono messaggi di successo nei query params
   */
  private checkSuccessMessage(): void {
    this.route.queryParams.subscribe(params => {
      if (params['reviewCreated'] === 'true') {
        this.successMessage = '✅ Recensione pubblicata con successo!';
        
        /* 
         * Rimuovo il parametro dall'URL
         */
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
        
        /* 
         * Nascondo il messaggio dopo 5 secondi
         */
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      }
    });
  }
  
  /* 
   * Ricarico le recensioni quando cambia la pagina o l'ordinamento.
   * Questo metodo viene chiamato sia dalla paginazione che dal
   * cambio di ordinamento.
   */
  loadReviews(page?: number, sortBy?: 'votes' | 'date'): void {
    if (page) this.currentPage = page;
    if (sortBy) this.sortBy = sortBy;
    
    if (!this.restaurant) return;
    
    this.loading = true;
    this.errorMessage = '';
    
    this.reviewService.getReviewsByRestaurant(
      this.restaurant.id,
      this.currentPage,
      this.reviewsPerPage,
      this.sortBy
    ).subscribe({
      next: (data) => {
        this.reviews = data.reviews;
        this.totalReviews = data.total;
        this.loading = false;
        
        /* 
         * Scroll smooth alla sezione recensioni
         */
        this.scrollToReviews();
      },
      error: (error) => {
        this.errorMessage = error;
        this.loading = false;
      }
    });
  }
  
  /* 
   * Scroll animato alla sezione recensioni
   */
  private scrollToReviews(): void {
    const reviewsSection = document.getElementById('reviews-section');
    if (reviewsSection) {
      reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  
  /* 
   * Gestisco il cambio di pagina nella paginazione
   */
  onPageChange(page: number): void {
    if (page !== this.currentPage && page > 0 && page <= this.totalPages) {
      this.loadReviews(page);
    }
  }
  
  /* 
   * Cambio l'ordinamento delle recensioni tra:
   * - 'votes': più votate prima
   * - 'date': più recenti prima
   */
  changeSortOrder(sortBy: 'votes' | 'date'): void {
    if (this.sortBy !== sortBy) {
      this.currentPage = 1; // Reset alla prima pagina
      this.loadReviews(1, sortBy);
    }
  }
  
  /* 
   * Navigo alla pagina di modifica del ristorante
   */
  editRestaurant(): void {
    if (!this.restaurant || !this.isOwner) return;
    
    this.router.navigate(['/restaurants', this.restaurant.id, 'edit']);
  }
  
  /* 
   * Gestisco l'eliminazione del ristorante con doppia conferma
   */
  deleteRestaurant(): void {
    if (!this.restaurant || !this.isOwner) {
      return;
    }
    
    /* 
     * Prima conferma
     */
    const confirmed = confirm(
      '⚠️ ATTENZIONE ⚠️\n\n' +
      `Stai per eliminare il ristorante "${this.restaurant.name}".\n\n` +
      'Questa azione:\n' +
      '- Eliminerà il ristorante in modo permanente\n' +
      '- Eliminerà tutte le recensioni associate\n' +
      '- NON può essere annullata\n\n' +
      'Sei sicuro di voler procedere?'
    );
    
    if (!confirmed) return;
    
    /* 
     * Seconda conferma
     */
    const doubleConfirm = confirm(
      'Ultima conferma:\n\n' +
      'Confermi di voler eliminare definitivamente questo ristorante?'
    );
    
    if (!doubleConfirm) return;
    
    this.loading = true;
    this.errorMessage = '';
    
    this.restaurantService.deleteRestaurant(this.restaurant.id).subscribe({
      next: () => {
        /* 
         * Eliminazione riuscita, reindirizzo alla lista
         * con un messaggio di successo
         */
        this.router.navigate(['/restaurants'], { 
          queryParams: { deleted: 'true' } 
        });
      },
      error: (error) => {
        this.errorMessage = `Errore durante l'eliminazione: ${error}`;
        this.loading = false;
      }
    });
  }
  
  /* 
   * Navigo alla pagina di creazione recensione
   */
  createReview(): void {
    if (!this.restaurant) return;
    
    if (!this.currentUser) {
      /* 
       * Se l'utente non è loggato, lo reindirizzo al login
       */
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/restaurants/${this.restaurant.id}/reviews/new` }
      });
      return;
    }
    
    this.router.navigate(['/restaurants', this.restaurant.id, 'reviews', 'new']);
  }
  
  /* 
   * Gestisco l'upvote di una recensione
   */
  upvoteReview(reviewId: number, index: number): void {
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }
    
    this.voteService.upvoteReview(reviewId).subscribe({
      next: () => this.updateReviewAfterVote(reviewId, index),
      error: (error) => {
        this.errorMessage = `Errore durante il voto: ${error}`;
      }
    });
  }
  
  /* 
   * Gestisco il downvote di una recensione
   */
  downvoteReview(reviewId: number, index: number): void {
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }
    
    this.voteService.downvoteReview(reviewId).subscribe({
      next: () => this.updateReviewAfterVote(reviewId, index),
      error: (error) => {
        this.errorMessage = `Errore durante il voto: ${error}`;
      }
    });
  }
  
  /* 
   * Aggiorno i dati della recensione dopo un voto.
   * Ricarico la recensione specifica per avere i dati aggiornati
   * dei voti senza dover ricaricare tutta la lista.
   */
  private updateReviewAfterVote(reviewId: number, index: number): void {
    if (!this.restaurant || index < 0 || index >= this.reviews.length) return;
    
    /* 
     * Ricarico solo la recensione specifica che è stata votata
     */
    this.reviewService.getReviewsByRestaurant(
      this.restaurant.id,
      this.currentPage,
      this.reviewsPerPage,
      this.sortBy
    ).subscribe({
      next: (data) => {
        /* 
         * Aggiorno la lista delle recensioni con i nuovi dati
         */
        this.reviews = data.reviews;
        this.totalReviews = data.total;
      },
      error: (error) => {
        this.errorMessage = error;
      }
    });
  }
  
  /* 
   * Formatto la valutazione media con stelle
   */
  formatRating(rating: number | undefined): string {
    if (!rating) return 'Nessuna';
    return rating.toFixed(1);
  }

  /* 
   * Genero un array di stelle per la visualizzazione del rating
   */
  getStarsArray(rating: number | undefined): number[] {
    const stars = Math.round(rating || 0);
    return Array(stars).fill(0);
  }

  /* 
   * Genero un array di stelle vuote
   */
  getEmptyStarsArray(rating: number | undefined): number[] {
    const stars = Math.round(rating || 0);
    return Array(5 - stars).fill(0);
  }

  /* 
   * Verifico se l'utente può modificare una recensione
   */
  canEditReview(review: Review): boolean {
    return !!(this.currentUser && review.userId === this.currentUser.id);
  }

  /* 
   * Copio l'indirizzo negli appunti
   */
  copyAddress(): void {
    if (!this.restaurant?.location?.address) return;
    
    navigator.clipboard.writeText(this.restaurant.location.address).then(() => {
      this.successMessage = '📋 Indirizzo copiato negli appunti!';
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    });
  }

  /* 
   * Apro Google Maps con l'indirizzo del ristorante
   */
  openInMaps(): void {
    if (!this.restaurant?.location?.address) return;
    
    const address = encodeURIComponent(this.restaurant.location.address);
    const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
    window.open(url, '_blank');
  }
  
  /* 
   * Calcolo il numero totale di pagine per la paginazione
   */
  get totalPages(): number {
    return Math.ceil(this.totalReviews / this.reviewsPerPage);
  }
  
  /* 
   * Genero un array di numeri di pagina da visualizzare.
   * Mostro al massimo 5 pagine centrate sulla pagina corrente.
   */
  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  /* 
   * Verifico se ci sono recensioni da mostrare
   */
  get hasReviews(): boolean {
    return this.reviews.length > 0;
  }

  /* 
   * Ottengo il testo del pulsante di ordinamento
   */
  get sortButtonText(): string {
    return this.sortBy === 'votes' ? 'Più votate' : 'Più recenti';
  }
}