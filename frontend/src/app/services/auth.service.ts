import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

/**
 * Servizio di autenticazione dell'applicazione.
 * Gestisce login, logout, registrazione e operazioni relative al profilo utente.
 * Utilizza sessionStorage per i dati di autenticazione che vengono cancellati alla chiusura del browser.
 * 
 * @author BeaChichi27
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private userSubject = new BehaviorSubject<User | null>(null);
  
  /** Usa sessionStorage per cancellare i dati quando chiudi il browser */
  private useLocalStorage = false;
  
  /**
   * Costruttore del servizio.
   * Carica automaticamente i dati dell'utente dallo storage all'avvio.
   * 
   * @param http Client HTTP per le chiamate API
   */
  constructor(private http: HttpClient) { 
    this.loadUserFromStorage();
  }
  
  /**
   * Observable dell'utente corrente.
   * Permette ai componenti di sottoscriversi ai cambiamenti dello stato di autenticazione.
   * 
   * @returns Observable che emette l'utente corrente o null se non autenticato
   */
  get currentUser$(): Observable<User | null> {
    return this.userSubject.asObservable();
  }
  
  /**
   * Accesso sincrono all'utente corrente.
   * Utile quando serve il valore immediato senza sottoscriversi all'Observable.
   * 
   * @returns L'utente corrente o null se non autenticato
   */
  getCurrentUser(): User | null {
    return this.userSubject.value;
  }
  
  /**
   * Verifica se l'utente è autenticato.
   * 
   * @returns true se l'utente è loggato, false altrimenti
   */
  get isLoggedIn(): boolean {
    return !!this.userSubject.value;
  }
  
  /**
   * Recupera il token JWT dell'utente corrente.
   * Cerca prima nei cookie, poi in sessionStorage.
   * 
   * @returns Il token JWT o null se non presente
   */
  get token(): string | null {
    return this.getCookie('token') || sessionStorage.getItem('token');
  }
  
  /**
   * Registra un nuovo utente nel sistema.
   * 
   * @param username Nome utente univoco
   * @param email Indirizzo email dell'utente
   * @param password Password dell'utente (minimo 6 caratteri)
   * @param isOwner Se true, l'utente sarà registrato come proprietario di ristoranti
   * @returns Observable con il risultato della registrazione
   * @throws Errore se username o email sono già in uso
   */
  register(username: string, email: string, password: string, isOwner: boolean = false): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { username, email, password, isOwner })
      .pipe(
        catchError(this.handleError)
      );
  }
  
  /**
   * Autentica un utente nel sistema.
   * In caso di successo, salva il token e i dati utente in sessionStorage e cookie.
   * 
   * @param username Nome utente
   * @param password Password dell'utente
   * @returns Observable con il token JWT e l'ID utente
   * @throws Errore se le credenziali non sono valide (status 401)
   */
  login(username: string, password: string): Observable<any> {
    return this.http.post<{token: string, userId: number}>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap(response => {
          /* 
          Salvo il token e le informazioni dell'utente sia in sessionStorage
          che in cookie per maggiore flessibilità e sicurezza.
          Questa logica viene eseguita solo in caso di successo.
          */
          const user: User = {
            id: response.userId,
            username
          };
          
          this.saveAuthData(response.token, user);
          this.userSubject.next(user);
        }),
        catchError(this.handleError)
      );
  }
  
  /**
   * Effettua il logout dell'utente corrente.
   * Rimuove tutti i dati di autenticazione da sessionStorage e cookie.
   * Notifica tutti i subscriber del cambio di stato.
   */
  logout(): void {
    this.clearAuthData();
    this.userSubject.next(null);
  }

  /**
   * Aggiorna le informazioni del profilo utente.
   * Salva i dati aggiornati in storage e notifica i cambiamenti.
   * 
   * @param data Dati da aggiornare (email, firstName, lastName)
   * @returns Observable con i dati utente aggiornati
   * @throws Errore se l'aggiornamento fallisce
   */
  updateProfile(data: { email?: string; firstName?: string; lastName?: string }): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, data)
      .pipe(
        tap(updatedUser => {
          /* 
           * Salvo l'utente aggiornato in entrambi gli storage
           * e notifico tutti i subscriber
           */
          const currentToken = this.token;
          if (currentToken) {
            this.saveAuthData(currentToken, updatedUser);
          }
          this.userSubject.next(updatedUser);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Cambia la password dell'utente corrente.
   * Richiede la password attuale per motivi di sicurezza.
   * 
   * @param data Oggetto contenente currentPassword e newPassword
   * @returns Observable con il risultato dell'operazione
   * @throws Errore se la password attuale è errata o la nuova password non è valida
   */
  changePassword(data: { currentPassword: string; newPassword: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/change-password`, data)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Elimina permanentemente l'account dell'utente corrente.
   * ATTENZIONE: Questa operazione è irreversibile e rimuove tutti i dati associati.
   * Dopo l'eliminazione, esegue automaticamente il logout.
   * 
   * @returns Observable con il risultato dell'operazione
   * @throws Errore se l'eliminazione fallisce
   */
  deleteAccount(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/account`)
      .pipe(
        tap(() => {
          this.logout();
        }),
        catchError(this.handleError)
      );
  }
  
  /**
   * Carica i dati dell'utente dallo storage all'avvio dell'applicazione.
   * Cerca prima nei cookie, poi in sessionStorage come fallback.
   * Se trova dati validi, ripristina lo stato di autenticazione.
   * 
   * @private
   */
  private loadUserFromStorage(): void {
    const tokenFromCookie = this.getCookie('token');
    const userFromCookie = this.getCookie('user');
    
    if (tokenFromCookie && userFromCookie) {
      this.userSubject.next(JSON.parse(decodeURIComponent(userFromCookie)));
      return;
    }
    
    const token = sessionStorage.getItem('token');
    const user = sessionStorage.getItem('user');
    
    if (token && user) {
      this.userSubject.next(JSON.parse(user));
    }
  }

  /**
   * Gestisce gli errori delle chiamate HTTP al backend.
   * Converte gli errori tecnici in messaggi user-friendly.
   * 
   * @param error Errore HTTP ricevuto dal backend
   * @returns Observable che emette un messaggio di errore leggibile
   * @private
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let userMessage = 'Autenticazione fallita. Riprova.';
    
    if (error.status === 401) {
      userMessage = 'Nome utente o password non validi.';
    } else if (error.error?.message) {
      userMessage = error.error.message;
    }
    
    console.error('Auth Service Error:', error);
    
    return throwError(() => userMessage);
  }

  /**
   * Salva un valore in un cookie con le opportune impostazioni di sicurezza.
   * I cookie vengono configurati con SameSite=Strict per prevenire attacchi CSRF.
   * 
   * @param name Nome del cookie
   * @param value Valore da salvare (viene codificato automaticamente)
   * @param days Giorni di validità del cookie (default: 7)
   * @private
   */
  private setCookie(name: string, value: string, days: number = 7): void {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    
    document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/;SameSite=Strict`;
  }

  /**
   * Legge un valore da un cookie.
   * 
   * @param name Nome del cookie da leggere
   * @returns Il valore decodificato del cookie o null se non esiste
   * @private
   */
  private getCookie(name: string): string | null {
    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');
    
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }
    
    return null;
  }

  /**
   * Elimina un cookie impostando la sua data di scadenza nel passato.
   * 
   * @param name Nome del cookie da eliminare
   * @private
   */
  private deleteCookie(name: string): void {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }

  /**
   * Salva i dati di autenticazione in sessionStorage e cookie.
   * sessionStorage viene cancellato automaticamente alla chiusura del browser,
   * mentre i cookie hanno una scadenza breve (1 giorno) per maggiore sicurezza.
   * 
   * @param token Token JWT dell'utente
   * @param user Oggetto con i dati dell'utente
   * @private
   */
  private saveAuthData(token: string, user: User): void {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
    
    this.setCookie('token', token, 1);
    this.setCookie('user', JSON.stringify(user), 1);
  }

  /**
   * Rimuove tutti i dati di autenticazione da sessionStorage e cookie.
   * Chiamato durante il logout o l'eliminazione dell'account.
   * 
   * @private
   */
  private clearAuthData(): void {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    
    this.deleteCookie('token');
    this.deleteCookie('user');
  }
}