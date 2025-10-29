import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Review } from '../../../models/review.model';
import { ReviewService } from '../../../services/review.service';
import { AuthService } from '../../../services/auth.service';
import { VoteService } from '../../../services/vote.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-rev-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './rev-list.component.html',
  styleUrls: ['./rev-list.component.scss']
})
export class RevListComponent implements OnInit {
  /* 
   * Input per permettere l'uso del componente in due modalità:
   * 1. Autonomo: passa restaurantId e il componente carica le recensioni
   * 2. Integrato: passa reviews[] direttamente (es. da parent component)
   */
  @Input() restaurantId?: number;
  @Input() reviews?: Review[];
  @Output() reviewDeleted = new EventEmitter<number>();
  @Output() reviewVoted = new EventEmitter<number>();
  
  internalReviews: Review[] = [];
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
  ) {
    console.log("ABBASSO GLOVO");
  }
  
  /* 
   * All'inizializzazione, decido quale modalità usare:
   * - Se reviews[] è fornito tramite @Input, lo uso direttamente
   * - Altrimenti, se restaurantId è fornito, carico le recensioni dal server
   * Questo rende il componente flessibile e riutilizzabile.
   */
  ngOnInit(): void {
    if (this.reviews && this.reviews.length > 0) {
      /* 
       * Modalità INTEGRATO: uso le recensioni passate dal parent
       */
      this.internalReviews = this.reviews;
      this.totalReviews = this.reviews.length;
    } else if (this.restaurantId) {
      /* 
       * Modalità AUTONOMO: carico le recensioni dal server
       */
      this.loadReviews();
    } else {
      this.errorMessage = 'Nessun ristorante o recensioni specificate.';
    }
  }
  
  /* 
   * Carico le recensioni dal server applicando i filtri di paginazione e ordinamento.
   */
  loadReviews(): void {
    if (!this.restaurantId) {
      this.errorMessage = 'Nessun ristorante specificato.';
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    
    this.reviewService.getReviewsByRestaurant(
      this.restaurantId,
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
        this.internalReviews = response.reviews;
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
   * Mostro un voto positivo (upvote) a una recensione.
   * Prima verifico che l'utente sia autenticato, poi invio la richiesta
   * al server. Dopo la votazione, ricarico le recensioni per aggiornare
   * i conteggi dei voti.
   */
  upvoteReview(reviewId: number, index: number): void {
    if (!this.authService.isLoggedIn) {
      this.errorMessage = 'Devi essere autenticato per votare una recensione.';
      return;
    }
    
    if (this.voteInProgress) return; // Previene doppi clic
    
    this.voteInProgress = true;
    this.errorMessage = '';
    
    this.voteService.upvoteReview(reviewId).pipe(
      catchError(error => {
        this.errorMessage = error;
        this.voteInProgress = false;
        return of(null);
      })
    ).subscribe(result => {
      this.voteInProgress = false;
      
      if (result) {
        /* 
         * Ricarico le recensioni per aggiornare i conteggi.
         * In alternativa, potremmo aggiornare solo la recensione specifica
         * se il backend restituisse i nuovi conteggi.
         */
        this.loadReviews();
        
        /* 
         * Emetto un evento per notificare il parent component
         */
        this.reviewVoted.emit(reviewId);
      }
    });
  }
  
  /* 
   * Aggiungo un voto negativo (downvote) a una recensione.
   * Funziona in modo analogo a upvoteReview.
   */
  downvoteReview(reviewId: number, index: number): void {
    if (!this.authService.isLoggedIn) {
      this.errorMessage = 'Devi essere autenticato per votare una recensione.';
      return;
    }
    
    if (this.voteInProgress) return; // Previene doppi clic
    
    this.voteInProgress = true;
    this.errorMessage = '';
    
    this.voteService.downvoteReview(reviewId).pipe(
      catchError(error => {
        this.errorMessage = error;
        this.voteInProgress = false;
        return of(null);
      })
    ).subscribe(result => {
      this.voteInProgress = false;
      
      if (result) {
        /* 
         * Ricarico le recensioni per aggiornare i conteggi
         */
        this.loadReviews();
        
        /* 
         * Emetto un evento per notificare il parent component
         */
        this.reviewVoted.emit(reviewId);
      }
    });
  }
  
  /* 
   * Eliminazione di una recensione se sono l'autore.
   * Prima chiedo conferma all'utente, poi invio la richiesta al server
   * e rimuovo la recensione dalla lista locale se l'operazione va a buon fine.
   */
  deleteReview(reviewId: number): void {
    if (!confirm('Sei sicuro di voler eliminare questa recensione? L\'azione non può essere annullata.')) {
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    
    this.reviewService.deleteReview(reviewId).pipe(
      catchError(error => {
        this.errorMessage = error;
        this.loading = false;
        return of(null);
      })
    ).subscribe(success => {
      this.loading = false;
      
      if (success) {
        /* 
         * Rimuovo la recensione dalla lista locale
         */
        this.internalReviews = this.internalReviews.filter(r => r.id !== reviewId);
        this.totalReviews--;
        
        /* 
         * Se la pagina è vuota e non è la prima, vado alla pagina precedente
         */
        if (this.internalReviews.length === 0 && this.currentPage > 1) {
          this.onPageChange(this.currentPage - 1);
        } else if (this.restaurantId) {
          /* 
           * Altrimenti, ricarico la pagina corrente solo se in modalità autonoma
           */
          this.loadReviews();
        }
        
        /* 
         * Emetto un evento per notificare il componente parent
         */
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
  
  get displayedReviews(): Review[] {
    return this.internalReviews;
  }
  
  /* 
   * Verifico se ci sono recensioni da mostrare
   */
  get hasReviews(): boolean {
    return this.internalReviews.length > 0;
  }
  
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