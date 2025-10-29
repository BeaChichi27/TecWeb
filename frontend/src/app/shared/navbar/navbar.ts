import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { ReviewService } from '../../services/review.service';
import { LoadingSpinnerComponent } from '../loading-spinner/loading';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class NavbarComponent implements OnInit {
  isMenuOpen = false;
  isUserDropdownOpen = false;
  currentUser: User | null = null;
  showNoReviewsPopup = false;
  reviewsCount = 0;
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private reviewService: ReviewService
  ) {
    console.log("ABBASSO GLOVO");
  }
  
  /* 
   * All'inizializzazione del componente, verifico lo stato di autenticazione
   * e mi iscrivo ai cambiamenti dell'utente corrente per mantenere la navbar
   * aggiornata quando l'utente effettua login o logout.
   */
  ngOnInit(): void {
    // Verifico subito lo stato di autenticazione
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.loadUserReviewsCount();
    }
    
    // Segno i cambiamenti dello stato di autenticazione
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (this.currentUser) {
        this.loadUserReviewsCount();
      } else {
        this.reviewsCount = 0;
      }
    });
  }

  private loadUserReviewsCount(): void {
    if (!this.currentUser) return;
    this.reviewService.getUserReviews(this.currentUser.id).subscribe({
      next: (response) => {
        this.reviewsCount = response.total || 0;
      },
      error: () => {
        this.reviewsCount = 0;
      }
    });
  }
  
  /* 
   * Verifico se l'utente è attualmente autenticato.
   */
  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }
  
  /* 
   * Gestisco il processo di logout. Chiamo il metodo di logout del servizio
   * di autenticazione e, una volta completato, reindirizzo l'utente alla
   * pagina principale e chiudo il menu mobile se aperto.
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
    this.isMenuOpen = false;
  }
  
  /* 
   * Alterno lo stato del menu mobile tra aperto e chiuso.
   */
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  /* 
   * Alterno lo stato del dropdown del menu utente.
   */
  toggleUserDropdown(): void {
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
  }
  
  /* 
   * Chiudo il menu mobile e il dropdown utente quando l'utente clicca al di fuori.
   * Utilizzo @HostListener per ascoltare gli eventi di clic sul documento.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const navbar = document.querySelector('.navbar-container');
    const menuButton = document.querySelector('.menu-toggle-button');
    const userMenuToggle = document.querySelector('.user-menu-toggle');
    const userDropdown = document.querySelector('.user-dropdown');
    
    // Gestisci il menu mobile
    if (menuButton?.contains(target)) {
      return;
    }
    
    if (this.isMenuOpen && navbar && !navbar.contains(target)) {
      this.isMenuOpen = false;
    }
    
    // Gestisci il dropdown utente
    if (userMenuToggle?.contains(target)) {
      return;
    }
    
    if (this.isUserDropdownOpen && userDropdown && !userDropdown.contains(target)) {
      this.isUserDropdownOpen = false;
    }
  }

  handleMyReviewsClick(): void {
    this.closeMenu();
    if (this.reviewsCount === 0) {
      this.showNoReviewsPopup = true;
    } else {
      this.router.navigate(['/profile'], { queryParams: { tab: 'reviews' } });
    }
  }

  closeNoReviewsPopup(): void {
    this.showNoReviewsPopup = false;
  }
  
  
  /* 
   * Chiudo il menu mobile dopo che l'utente ha cliccato su un link di navigazione.
   */
  closeMenu(): void {
    this.isMenuOpen = false;
    this.isUserDropdownOpen = false;
  }
}