import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Vote, VoteType, CreateVoteDto } from '../models/vote.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VoteService {
  private apiUrl = `${environment.apiUrl}/votes`;
  
  constructor(private http: HttpClient) {}
  
  /* Aggiunge o aggiorna un voto per una recensione.
     Se l'utente non ha ancora votato, crea un nuovo voto.
     Se l'utente ha già votato con lo stesso tipo, rimuove il voto (toggle).
     Se l'utente ha già votato con un tipo diverso, cambia il tipo di voto.
  */
  voteReview(reviewId: number, voteType: VoteType): Observable<Vote> {
    const voteData: CreateVoteDto = { reviewId, voteType };
    
    return this.http.post<Vote>(this.apiUrl, voteData)
      .pipe(
        catchError(this.handleError)
      );
  }
  
  /* Funzione di utilità per aggiungere un upvote.
     Utilizza internamente il metodo voteReview.
  */
  upvoteReview(reviewId: number): Observable<Vote> {
    return this.voteReview(reviewId, VoteType.UPVOTE);
  }
  
  /* Funzione di utilità per aggiungere un downvote.
     Utilizza internamente il metodo voteReview.
  */
  downvoteReview(reviewId: number): Observable<Vote> {
    return this.voteReview(reviewId, VoteType.DOWNVOTE);
  }
  
  /* Rimuove il voto dell'utente corrente da una recensione specifica.
  */
  removeVote(reviewId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/review/${reviewId}`)
      .pipe(
        catchError(this.handleError)
      );
  }
  
  /* Ottiene il voto corrente dell'utente per una recensione specifica.
     Restituisce null se l'utente non ha ancora votato.
     Utile per evidenziare il pulsante attivo nell'interfaccia utente.
  */
  getUserVoteForReview(reviewId: number): Observable<Vote | null> {
    return this.http.get<Vote | null>(`${this.apiUrl}/review/${reviewId}/user`)
      .pipe(
        catchError(error => {
          // Se l'errore è 404 (nessun voto trovato), restituisco null come valore valido
          if (error.status === 404) {
            return of(null);  
          }
          return this.handleError(error);
        })
      );
  }
  
  /* Ottiene tutti i voti per una recensione specifica.
     Utile per analisi o statistiche dettagliate.
  */
  getVotesByReview(reviewId: number): Observable<Vote[]> {
    return this.http.get<Vote[]>(`${this.apiUrl}/review/${reviewId}`)
      .pipe(
        catchError(this.handleError)
      );
  }
  
  /* Ottiene tutti i voti effettuati dall'utente corrente.
     Utile per la sezione profilo dell'utente.
  */
  getUserVotes(): Observable<Vote[]> {
    return this.http.get<Vote[]>(`${this.apiUrl}/user`)
      .pipe(
        catchError(this.handleError)
      );
  }
  
  /* Gestisce gli errori HTTP e restituisce messaggi d'errore comprensibili.
  */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Si è verificato un errore durante la gestione del voto.';
    
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
            errorMessage = 'Richiesta di voto non valida.';
            break;
          case 401:
            errorMessage = 'Devi effettuare l\'accesso per votare.';
            break;
          case 403:
            errorMessage = 'Non hai i permessi per eseguire questa operazione.';
            break;
          case 404:
            errorMessage = 'Recensione non trovata.';
            break;
          case 409:
            errorMessage = 'Hai già votato questa recensione.';
            break;
        }
      }
    }
    
    console.error('Vote Service Error:', error);
    
    return throwError(() => errorMessage);
  }
}