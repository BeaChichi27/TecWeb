import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

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
  currentUser: User | null = null;
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  /* 
   * All'inizializzazione del componente, verifico lo stato di autenticazione
   * e mi iscrivo ai cambiamenti dell'utente corrente per mantenere la navbar
   * aggiornata quando l'utente effettua login o logout.
   */
  ngOnInit(): void {
    // Verifico subito lo stato di autenticazione
    this.currentUser = this.authService.getCurrentUser();
    
    // Mi iscrivo ai cambiamenti dello stato di autenticazione
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }
  
  /* 
   * Verifico se l'utente è attualmente autenticato.
   * Questo metodo è utile nel template per mostrare contenuti condizionali.
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
   * Questo metodo viene chiamato quando l'utente clicca sul pulsante hamburger.
   */
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
  
  /* 
   * Chiudo il menu mobile quando l'utente clicca al di fuori di esso.
   * Utilizzo @HostListener per ascoltare gli eventi di clic sul documento.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const navbar = document.querySelector('.navbar-container');
    const menuButton = document.querySelector('.menu-toggle-button');
    
    // Non chiudere il menu se il clic è sul pulsante di toggle o è già gestito
    if (menuButton?.contains(target) || !this.isMenuOpen) {
      return;
    }
    
    // Chiudi il menu se il clic è fuori dalla navbar
    if (navbar && !navbar.contains(target)) {
      this.isMenuOpen = false;
    }
  }
  
  
  /* 
   * Chiudo il menu mobile dopo che l'utente ha cliccato su un link di navigazione.
   * Questo migliora l'esperienza utente sui dispositivi mobili.
   */
  closeMenu(): void {
    this.isMenuOpen = false;
  }
}