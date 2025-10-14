import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RestaurantService } from '../../services/restaurant.service';
import { Restaurant } from '../../models/restaurant.model';
import { User } from '../../models/user.model';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  currentUser: User | null = null;
  featuredRestaurants: Restaurant[] = [];
  loading = false;
  errorMessage = '';
  
  constructor(
    private authService: AuthService,
    private restaurantService: RestaurantService
  ) {}
  
  /* 
   * Quando viene inizializzato, verifica se l'utente è già autenticato 
   * recuperandolo dal servizio di autentic azione. Si iscrive inoltre
   * ai cambiamenti dell'utente corrente per aggiornare la UI di conseguenza.
   * Infine, carica una selezione di ristoranti in evidenza da mostrare
   * nella home page.
   */
  ngOnInit(): void {
    // Recupero l'utente corrente (se autenticato)
    this.currentUser = this.authService.getCurrentUser();
    
    // Mi iscrivo ai cambiamenti dello stato di autenticazione
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    
    // Carico i ristoranti in evidenza
    this.loadFeaturedRestaurants();
  }
  
  /* 
   * Carico una selezione di ristoranti in evidenza da mostrare nella home page.
   * Utilizzo il RestaurantService per ottenere i ristoranti con le valutazioni 
   * più alte, limitando il risultato a pochi elementi per non appesantire la pagina.
   */
  private loadFeaturedRestaurants(): void {
    this.loading = true;
    
    this.restaurantService.getRestaurants(1, 3, undefined, 'rating')
      .subscribe({
        next: (response) => {
          this.featuredRestaurants = response.restaurants;
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = `Impossibile caricare i ristoranti in evidenza: ${error}`;
          this.loading = false;
        }
      });
  }
  
  /* 
   * Verifico se l'utente è attualmente autenticato.
   * Questa proprietà è utile nel template per mostrare contenuti diversi
   * a utenti autenticati e non autenticati.
   */
  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }
  
  /* 
   * Fornisco una versione più corta della descrizione di un ristorante
   * per visualizzarla nelle card della home page, aggiungendo puntini 
   * di sospensione se il testo viene troncato.
   */
  getTruncatedDescription(description: string, maxLength: number = 100): string {
    if (description.length <= maxLength) {
      return description;
    }
    
    return description.substring(0, maxLength) + '...';
  }
}