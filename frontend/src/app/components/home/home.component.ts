import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RestaurantService } from '../../services/restaurant.service';
import { Restaurant } from '../../models/restaurant.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  currentUser: User | null = null;
  featuredRestaurants: Restaurant[] = [];
  loading = false;
  errorMessage = '';
  cookiesEnabled = true;
  
  constructor(
    private authService: AuthService,
    private restaurantService: RestaurantService
  ) {
    // Easter egg nascosto - visibile solo nella console del browser
    console.log("ABBASSO GLOVO");
    
    // Verifica se i cookie sono abilitati
    this.checkCookiesEnabled();
  }
  
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
   * Utilizzo il RestaurantService per ottenere i primi ristoranti disponibili,
   * limitando il risultato a 6 elementi per la visualizzazione in griglia.
   */
  loadFeaturedRestaurants(): void {
    this.loading = true;
    
    this.restaurantService.getRestaurants(1, 6)
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

  /**
   * Verifica se i cookie sono abilitati nel browser
   * Necessario per il corretto funzionamento dell'autenticazione
   */
  private checkCookiesEnabled(): void {
    try {
      // Tenta di impostare un cookie di test
      document.cookie = 'cookieTest=1; SameSite=Strict';
      this.cookiesEnabled = document.cookie.indexOf('cookieTest') !== -1;
      // Rimuove il cookie di test
      document.cookie = 'cookieTest=1; expires=Thu, 01-Jan-1970 00:00:01 GMT; SameSite=Strict';
    } catch (e) {
      this.cookiesEnabled = false;
    }
  }
}