import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

import { Restaurant } from '../../../models/restaurant.model';
import { RestaurantService } from '../../../services/restaurant.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading';

@Component({
  selector: 'app-rest-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LoadingSpinnerComponent],
  templateUrl: './rest-list.component.html',
  styleUrls: ['./rest-list.component.scss']
})
export class RestListComponent implements OnInit, OnDestroy {
  /* 
   * Dati e stato del componente
   */
  restaurants: Restaurant[] = [];
  loading = false;
  errorMessage = '';
  currentUser: User | null = null;
  
  /* 
   * Modalità di visualizzazione:
   * - false: lista pubblica (tutti i ristoranti)
   * - true: lista personale (solo ristoranti dell'utente)
   */
  isPersonalList = false;
  
  /* 
   * Parametri di ricerca con debounce per ottimizzare le chiamate API
   */
  searchTerm = '';
  private searchTerms = new Subject<string>();
  private searchSubscription?: Subscription;
  private userSubscription?: Subscription;
  
  /* 
   * Parametri di paginazione
   */
  currentPage = 1;
  totalRestaurants = 0;
  restaurantsPerPage = 9; // Aumentato a 9 per una griglia 3x3

  constructor(
    private restaurantService: RestaurantService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    /* 
     * Determino la modalità di visualizzazione dalla configurazione della route.
     * Se route.data contiene personalList: true, mostro solo i ristoranti
     * dell'utente corrente, altrimenti mostro tutti i ristoranti.
     */
    this.route.data.subscribe(data => {
      this.isPersonalList = data['personalList'] || false;
    });

    /* 
     * Mi sottoscrivo all'utente corrente per sapere chi è loggato
     * e poter filtrare i ristoranti di conseguenza
     */
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      
      /* 
       * Se sono in modalità personale ma l'utente non è loggato,
       * lo reindirizzo al login
       */
      if (this.isPersonalList && !user) {
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: '/my-restaurants' }
        });
        return;
      }
      
      /* 
       * Ricarico i ristoranti quando cambia l'utente
       * (ad esempio dopo login/logout)
       */
      this.loadRestaurants();
    });

    /* 
     * Configuro la logica di ricerca con debounce.
     * Attendo 300ms dopo l'ultima digitazione prima di effettuare
     * la ricerca, per evitare troppe chiamate API.
     */
    this.searchSubscription = this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm = term;
      this.currentPage = 1; // Reset alla prima pagina quando cambia la ricerca
      this.loadRestaurants();
    });
  }

  ngOnDestroy(): void {
    /* 
     * Pulisco le sottoscrizioni per evitare memory leak
     */
    this.searchSubscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
  }

  /* 
   * Gestisco l'input dell'utente nella barra di ricerca.
   * Il Subject applicherà automaticamente il debounce.
   */
  onSearch(term: string): void {
    this.searchTerms.next(term);
  }

  /* 
   * Pulisco la barra di ricerca e ricarico tutti i ristoranti
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.searchTerms.next('');
  }

  /* 
   * Carico i ristoranti dal server con filtri e paginazione.
   * In base alla modalità, carico tutti i ristoranti o solo quelli dell'utente.
   */
  loadRestaurants(): void {
    this.loading = true;
    this.errorMessage = '';
    
    /* 
     * Se sono in modalità personale, carico solo i ristoranti
     * dell'utente corrente
     */
    if (this.isPersonalList && this.currentUser) {
      this.restaurantService.getRestaurantsByOwner(
        this.currentUser.id,
        this.currentPage,
        this.restaurantsPerPage
      ).subscribe({
        next: (response) => {
          /* 
           * Applico il filtro di ricerca lato client se presente,
           * dato che l'endpoint potrebbe non supportare la ricerca
           */
          let filteredRestaurants = response.restaurants || [];
          
          if (this.searchTerm) {
            const searchLower = this.searchTerm.toLowerCase();
            filteredRestaurants = filteredRestaurants.filter(r => 
              r.name.toLowerCase().includes(searchLower) ||
              r.description?.toLowerCase().includes(searchLower) ||
              r.location?.address?.toLowerCase().includes(searchLower)
            );
          }
          
          this.restaurants = filteredRestaurants;
          this.totalRestaurants = response.total || filteredRestaurants.length;
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = error;
          this.loading = false;
          this.restaurants = [];
        }
      });
    } else {
      /* 
       * Modalità pubblica: carico tutti i ristoranti con paginazione
       * e ricerca lato server
       */
      this.restaurantService.getRestaurants(
        this.currentPage, 
        this.restaurantsPerPage, 
        this.searchTerm
      ).subscribe({
        next: (response) => {
          this.restaurants = response.data || [];
          this.totalRestaurants = response.total || 0;
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = error;
          this.loading = false;
          this.restaurants = [];
        }
      });
    }
  }

  /* 
   * Cambio la pagina corrente e ricarico i ristoranti
   */
  onPageChange(page: number): void {
    if (page !== this.currentPage && page > 0 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadRestaurants();
      
      /* 
       * Scroll to top per migliorare l'esperienza utente
       */
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /* 
   * Navigo alla pagina precedente
   */
  prevPage(): void {
    if (this.currentPage > 1) {
      this.onPageChange(this.currentPage - 1);
    }
  }

  /* 
   * Navigo alla pagina successiva
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.onPageChange(this.currentPage + 1);
    }
  }

  /* 
   * Navigo alla pagina di creazione di un nuovo ristorante
   */
  createRestaurant(): void {
    if (!this.currentUser) {
      /* 
       * Se l'utente non è loggato, lo reindirizzo al login
       * con il returnUrl impostato per tornare qui dopo
       */
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/restaurants/new' }
      });
      return;
    }
    
    this.router.navigate(['/restaurants/new']);
  }

  /* 
   * Verifico se l'utente corrente è il proprietario di un ristorante
   */
  isOwner(restaurant: Restaurant): boolean {
    return !!(this.currentUser && restaurant.ownerId === this.currentUser.id);
  }

  /* 
   * Formatto la valutazione media con una stella
   */
  formatRating(rating: number | undefined): string {
    if (!rating) return 'Nuova';
    return rating.toFixed(1);
  }

  /* 
   * Ottengo il testo del placeholder per la ricerca
   * in base alla modalità
   */
  get searchPlaceholder(): string {
    return this.isPersonalList 
      ? 'Cerca nei tuoi ristoranti...' 
      : 'Cerca ristoranti per nome, descrizione o città...';
  }

  /* 
   * Ottengo il titolo della pagina in base alla modalità
   */
  get pageTitle(): string {
    return this.isPersonalList 
      ? 'I Miei Ristoranti' 
      : 'Esplora i Ristoranti';
  }

  /* 
   * Ottengo il sottotitolo della pagina in base alla modalità
   */
  get pageSubtitle(): string {
    if (this.isPersonalList) {
      const count = this.totalRestaurants;
      return count === 0 
        ? 'Non hai ancora creato nessun ristorante' 
        : `Hai creato ${count} ${count === 1 ? 'ristorante' : 'ristoranti'}`;
    }
    return 'Scopri i migliori ristoranti recensiti dalla nostra community';
  }

  /* 
   * Calcolo il numero totale di pagine
   */
  get totalPages(): number {
    return Math.ceil(this.totalRestaurants / this.restaurantsPerPage);
  }

  /* 
   * Genero un array di numeri di pagina da visualizzare.
   * Mostro solo un numero limitato di pagine intorno alla pagina corrente
   * per evitare una paginazione troppo lunga.
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
   * Verifico se ci sono risultati da mostrare
   */
  get hasResults(): boolean {
    return !this.loading && this.restaurants.length > 0;
  }

  /* 
   * Verifico se non ci sono risultati
   */
  get noResults(): boolean {
    return !this.loading && this.restaurants.length === 0 && !this.errorMessage;
  }

  /* 
   * Verifico se la ricerca è attiva
   */
  get isSearching(): boolean {
    return this.searchTerm.length > 0;
  }
}