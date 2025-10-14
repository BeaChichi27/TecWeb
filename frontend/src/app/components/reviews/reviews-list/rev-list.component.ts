import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Review } from '../../../models/review.model';
import { ReviewService } from '../../../services/review.service';
import { AuthService } from '../../../services/auth.service';
import { VoteService } from '../../../services/vote.service';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading';
import { catchError, of } from 'rxjs';
import { VoteType } from '../../../models/vote.model';

@Component({
  selector: 'app-rev-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './rev-list.component.html',
  styleUrls: ['./rev-list.component.scss']
})
export class RevListComponent implements OnInit {
  // Input per permettere l'uso del componente sia standalone che integrato
  @Input() restaurantId?: number;
  @Output() reviewDeleted = new EventEmitter<number>();
  
  reviews: Review[] = [];
  loading = false;
  errorMessage = '';
  
  // Parametri per paginazione e ordinamento
  currentPage = 1;
  totalReviews = 0;
  reviewsPerPage = 5;
  sortBy: 'date' | 'votes' = 'date';
  
  // Per la visualizzazione delle recensioni e l'interazione utente
  expandedReviewId: number | null = null;
  voteInProgress = false;
  
  constructor(
    private reviewService: ReviewService,
    private authService: AuthService,
    private voteService: VoteService
  ) {}
  
  /* 
   * All'inizializzazione, carico le recensioni per il ristorante specificato.
   * Se non viene fornito un restaurantId tramite input, controllo i parametri della URL.
   * Imposto i parametri di paginazione e ordinamento e carico i dati dal server.
   */
  ngOnInit(): void {
    if (this.restaurantId) {
      this.loadReviews();
    } else {
      this.errorMessage = 'Nessun ristorante specificato per le recensioni.';
    }
  }
  
  /* 
   * Carico le recensioni dal server applicando i filtri di paginazione e ordinamento.
   * Gestisco lo stato di caricamento e eventuali errori che potrebbero verificarsi.
   * Aggiorno la lista delle recensioni e il conteggio totale per la paginazione.
   */
  loadReviews(): void {
    this.loading = true;
    this.errorMessage = '';
    
    this.reviewService.getReviewsByRestaurant(
      this.restaurantId as number,
      this.currentPage,
      this.reviewsPerPage,
      this.sortBy
    ).pipe(
      catchError(error => {
        this.errorMessage = error;
        this.loading = false;
        return of(null);
      })
    ).subscribe(response => {
      this.loading = false;
      if (response) {
        this.reviews = response.reviews;
        this.totalReviews = response.total;
      }
    });
  }
  
  /* 
   * Cambio il criterio di ordinamento delle recensioni e ricarico i dati.
   * Questo metodo permette agli utenti di vedere le recensioni più recenti,
   * meglio valutate o più utili secondo la community.
   */
  changeSorting(sortOption: 'date' | 'votes'): void {
    this.sortBy = sortOption;
    this.currentPage = 1; // Reset alla prima pagina quando cambia l'ordinamento
    this.loadReviews();
  }
  
  /* 
   * Cambio la pagina corrente e ricarico le recensioni.
   * Controllo che il numero di pagina sia valido prima di effettuare il cambio.
   */
  onPageChange(page: number): void {
    if (page !== this.currentPage && page > 0 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadReviews();
    }
  }
  
  /* 
   * Espando o comprimo una recensione per mostrare o nascondere il testo completo.
   * Le recensioni lunghe vengono troncate nella visualizzazione normale,
   * e l'utente può espanderle per leggerle completamente.
   */
  toggleReviewExpansion(reviewId: number): void {
    if (this.expandedReviewId === reviewId) {
      this.expandedReviewId = null;
    } else {
      this.expandedReviewId = reviewId;
    }
  }
  
  /* 
   * Aggiungo un voto positivo o negativo alla recensione.
   * Prima verifico che l'utente sia autenticato, poi invio la richiesta
   * al server e aggiorno i dati locali per mostrare il risultato immediatamente.
   */
  voteReview(reviewId: number, isUpvote: boolean): void {
    if (!this.authService.isLoggedIn) {
      this.errorMessage = 'Devi essere autenticato per votare una recensione.';
      return;
    }
    
    if (this.voteInProgress) return; // Previene doppi clic
    
    this.voteInProgress = true;
    
    const voteType = isUpvote ? VoteType.UPVOTE : VoteType.DOWNVOTE;
    this.voteService.voteReview(reviewId, voteType).pipe(
      catchError(error => {
        this.errorMessage = error;
        this.voteInProgress = false;
        return of(null);
      })
    ).subscribe(result => {
      this.voteInProgress = false;
      
      if (result) {
        // Aggiorna la recensione votata con i nuovi conteggi
        const reviewIndex = this.reviews.findIndex(r => r.id === reviewId);
        if (reviewIndex !== -1) {
          this.reviews[reviewIndex] = {
            ...this.reviews[reviewIndex],
            upvotes: result.upvotes,
            downvotes: result.downvotes,
            userVote: result.userVote
          };
        }
      }
    });
  }
  
  /* 
   * Elimino una recensione se sono l'autore.
   * Prima chiedo conferma all'utente, poi invio la richiesta al server
   * e rimuovo la recensione dalla lista locale se l'operazione va a buon fine.
   */
  deleteReview(reviewId: number): void {
    if (!confirm('Sei sicuro di voler eliminare questa recensione? L\'azione non può essere annullata.')) {
      return;
    }
    
    this.loading = true;
    
    this.reviewService.deleteReview(reviewId).pipe(
      catchError(error => {
        this.errorMessage = error;
        this.loading = false;
        return of(null);
      })
    ).subscribe(success => {
      this.loading = false;
      
      if (success) {
        // Rimuovi la recensione dalla lista
        this.reviews = this.reviews.filter(r => r.id !== reviewId);
        this.totalReviews--;
        
        // Se la pagina è vuota e non è la prima, vai alla pagina precedente
        if (this.reviews.length === 0 && this.currentPage > 1) {
          this.onPageChange(this.currentPage - 1);
        } else {
          // Altrimenti, ricarica la pagina corrente
          this.loadReviews();
        }
        
        // Emetti un evento per notificare il componente parent
        this.reviewDeleted.emit(reviewId);
      }
    });
  }
  
  /* 
   * Verifico se l'utente corrente è l'autore di una recensione.
   * Questo mi serve per mostrare o nascondere i pulsanti di modifica
   * ed eliminazione per le recensioni.
   */
  isReviewAuthor(review: Review): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser != null && currentUser.id === review.userId;
  }
  
  /* 
   * Fornisco il numero totale di pagine calcolato in base al numero
   * di recensioni totali e al numero di recensioni per pagina.
   */
  get totalPages(): number {
    return Math.ceil(this.totalReviews / this.reviewsPerPage);
  }
  
  /* 
   * Genero un array di numeri di pagina da visualizzare nel paginatore.
   * Mostro solo un sottoinsieme di pagine centrate sulla pagina corrente
   * per non sovraccaricare l'interfaccia quando ci sono molte pagine.
   */
  get pageNumbers(): number[] {
    const pages = [];
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
   * Formatto la data di una recensione in un formato leggibile.
   * Utilizzo le opzioni locali italiane per mostrare giorno, mese e anno.
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  /* 
   * Genero un array di numeri da 1 a 5 per mostrare le stelle del rating.
   * Questo metodo è coerente con quello nel componente rev-form.
   */
  getRatingArray(rating: number): number[] {
    return Array(5).fill(0).map((_, index) => index < rating ? 1 : 0);
  }
}