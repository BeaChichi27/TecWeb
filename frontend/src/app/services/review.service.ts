import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Review, CreateReviewDto, UpdateReviewDto } from '../models/review.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}/reviews`;
  
  constructor(private http: HttpClient) {}
  
  /* Ottiene tutte le recensioni per un ristorante specifico.
     Supporta la paginazione e l'ordinamento per voti o data.
  */
  getReviewsByRestaurant(
    restaurantId: number, 
    page: number = 1, 
    limit: number = 10,
    sortBy: 'votes' | 'date' = 'votes'
  ): Observable<{ reviews: Review[], total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('sortBy', sortBy);
    
    return this.http.get<{ reviews: Review[], total: number }>(`${this.apiUrl}/restaurant/${restaurantId}`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }
  
  /* Ottiene una recensione specifica tramite il suo ID.
  */
  getReviewById(id: number): Observable<Review> {
    return this.http.get<Review>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }
  
  /* Ottiene tutte le recensioni scritte dall'utente corrente.
     Utile per la sezione profilo.
  */
  getUserReviews(
    userId: number,
    page: number = 1, 
    limit: number = 10
  ): Observable<{ reviews: Review[], total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get<{ reviews: Review[], total: number }>(`${this.apiUrl}/user/${userId}`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }
  
  /* Crea una nuova recensione per un ristorante.
  */
  createReview(reviewData: CreateReviewDto): Observable<Review> {
    return this.http.post<Review>(this.apiUrl, reviewData)
      .pipe(
        catchError(this.handleError)
      );
  }
  
  /* Aggiorna una recensione esistente.
     Solo l'autore può modificare una recensione.
     Il backend gestirà l'autorizzazione, restituendo 403 se non autorizzato.
  */
  updateReview(id: number, reviewData: UpdateReviewDto): Observable<Review> {
    return this.http.patch<Review>(`${this.apiUrl}/${id}`, reviewData)
      .pipe(
        catchError(this.handleError)
      );
  }
  
  /* Elimina una recensione specifica.
     Solo l'autore può eliminare una recensione.
     Il backend gestirà l'autorizzazione, restituendo 403 se non autorizzato.
  */
  deleteReview(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }
  
  /* Aggiunge un voto positivo (upvote) a una recensione.
     Se l'utente aveva già votato positivamente, il voto viene rimosso.
     Se l'utente aveva votato negativamente, il voto viene cambiato in positivo.
  */
  upvoteReview(reviewId: number): Observable<Review> {
    return this.http.post<Review>(`${this.apiUrl}/${reviewId}/upvote`, {})
      .pipe(
        catchError(this.handleError)
      );
  }
  
  /* Aggiunge un voto negativo (downvote) a una recensione.
     Se l'utente aveva già votato negativamente, il voto viene rimosso.
     Se l'utente aveva votato positivamente, il voto viene cambiato in negativo.
  */
  downvoteReview(reviewId: number): Observable<Review> {
    return this.http.post<Review>(`${this.apiUrl}/${reviewId}/downvote`, {})
      .pipe(
        catchError(this.handleError)
      );
  }
  
  /* Rimuove il voto dell'utente da una recensione.
  */
  removeVote(reviewId: number): Observable<Review> {
    return this.http.delete<Review>(`${this.apiUrl}/${reviewId}/vote`)
      .pipe(
        catchError(this.handleError)
      );
  }
  
  /* Gestisce gli errori HTTP e restituisce messaggi d'errore comprensibili.
  */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Si è verificato un errore. Riprova più tardi.';
    
    if (error.error instanceof ErrorEvent) {
      // Errore lato client
      errorMessage = `Errore: ${error.error.message}`;
    } else {
      // Errore lato server
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        switch (error.status) {
          case 400:
            errorMessage = 'Dati non validi per la recensione.';
            break;
          case 404:
            errorMessage = 'Recensione non trovata.';
            break;
          case 403:
            errorMessage = 'Non hai i permessi per eseguire questa operazione.';
            break;
        }
      }
    }
    
    console.error('Review Service Error:', error);
    
    return throwError(() => errorMessage);
  }
}