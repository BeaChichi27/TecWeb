import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Restaurant, CreateRestaurantDto, UpdateRestaurantDto } from '../models/restaurant.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RestaurantService {
  private apiUrl = 'http://localhost:3000/api/restaurants';
  
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}
  
  /* Ottiene la lista di tutti i ristoranti.
     Supporta la paginazione e il filtraggio per nome.
  */
  getRestaurants(page: number = 1, limit: number = 10, searchTerm?: string): Observable<{restaurants: Restaurant[], total: number}> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (searchTerm) {
      params = params.set('search', searchTerm);
    }
    
    return this.http.get<{restaurants: Restaurant[], total: number}>(this.apiUrl, { params })
      .pipe(
        catchError(this.handleError)
      );
  }
  
  /* Ottiene i dettagli di un ristorante specifico tramite il suo ID.
  */
  getRestaurantById(id: number): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }
  
  /* Crea un nuovo ristorante con i dati forniti.
     Poiché è necessario caricare un'immagine, uso FormData invece di JSON.
  */
  createRestaurant(restaurantData: CreateRestaurantDto): Observable<Restaurant> {
    const formData = new FormData();
    formData.append('name', restaurantData.name);
    formData.append('description', restaurantData.description);
    formData.append('location', JSON.stringify(restaurantData.location));
    
    if (restaurantData.image) {
      formData.append('image', restaurantData.image, restaurantData.image.name);
    }
    
    return this.http.post<Restaurant>(this.apiUrl, formData)
      .pipe(
        catchError(this.handleError)
      );
  }
  
  /* Aggiorna un ristorante esistente con i nuovi dati.
     Supporta aggiornamenti parziali (solo i campi che sono stati modificati).
  */
  updateRestaurant(id: number, restaurantData: UpdateRestaurantDto): Observable<Restaurant> {
    const formData = new FormData();
    
    if (restaurantData.name) {
      formData.append('name', restaurantData.name);
    }
    
    if (restaurantData.description) {
      formData.append('description', restaurantData.description);
    }
    
    if (restaurantData.location) {
      formData.append('location', JSON.stringify(restaurantData.location));
    }
    
    if (restaurantData.image) {
      formData.append('image', restaurantData.image, restaurantData.image.name);
    }
    
    return this.http.put<Restaurant>(`${this.apiUrl}/${id}`, formData)
      .pipe(
        catchError(this.handleError)
      );
  }
  
  /* Elimina un ristorante specifico tramite il suo ID.
     Questa operazione elimina anche tutte le recensioni associate.
  */
  deleteRestaurant(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }
  
  /* Verifica se l'utente corrente è il proprietario del ristorante.
     Utile per mostrare/nascondere i pulsanti di modifica e eliminazione.
  */
  canEditRestaurant(restaurantId: number): Observable<boolean> {
    return this.http.get<{ownerId: number}>(`${this.apiUrl}/${restaurantId}/owner`)
      .pipe(
        map(response => {
          const currentUser = this.authService.getCurrentUser();
          return currentUser?.id === response.ownerId;
        }),
        catchError(() => of(false))
      );
  }
  
  /* Ottiene i ristoranti creati dall'utente corrente.
     Utile per mostrare una lista nella pagina profilo dell'utente.
  */
  getUserRestaurants(userId: number, page: number = 1, limit: number = 10): Observable<{restaurants: Restaurant[], total: number}> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get<{restaurants: Restaurant[], total: number}>(`${this.apiUrl}/user/${userId}`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  /* Alias di getUserRestaurants per maggiore chiarezza semantica.
     Restituisce i ristoranti di cui un utente è proprietario.
  */
  getRestaurantsByOwner(userId: number, page: number = 1, limit: number = 10): Observable<{restaurants: Restaurant[], total: number}> {
    return this.getUserRestaurants(userId, page, limit);
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
            errorMessage = 'Dati non validi.';
            break;
          case 404:
            errorMessage = 'Ristorante non trovato.';
            break;
          case 403:
            errorMessage = 'Non hai i permessi per eseguire questa operazione.';
            break;
        }
      }
    }
    
    console.error('Restaurant Service Error:', error);
    
    return throwError(() => errorMessage);
  }
}