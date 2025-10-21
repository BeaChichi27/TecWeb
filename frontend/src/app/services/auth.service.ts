import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private userSubject = new BehaviorSubject<User | null>(null);
  
  // Preferenza di storage: prova prima i cookie, poi localStorage
  private useLocalStorage = true;
  
  constructor(private http: HttpClient) { 
    this.loadUserFromStorage();
  }
  
  get currentUser$(): Observable<User | null> {
    return this.userSubject.asObservable();
  }
  
  // Accesso sincrono all'utente corrente
  getCurrentUser(): User | null {
    return this.userSubject.value;
  }
  
  get isLoggedIn(): boolean {
    return !!this.userSubject.value;
  }
  
  get token(): string | null {
    // Prova prima cookie, poi localStorage
    return this.getCookie('token') || localStorage.getItem('token');
  }
  
  register(username: string, email: string, password: string, isOwner: boolean = false): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { username, email, password, isOwner })
      .pipe(
        catchError(this.handleError)
      );
  }
  
  login(username: string, password: string): Observable<any> {
    return this.http.post<{token: string, userId: number}>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap(response => {
          /* 
          Salvo il token e le informazioni dell'utente sia in localStorage
          che in cookie per maggiore flessibilità e sicurezza.
          Questa logica viene eseguita solo in caso di successo.
          */
          const user: User = {
            id: response.userId,
            username
          };
          
          // Usa il metodo helper per salvare in entrambi i posti
          this.saveAuthData(response.token, user);
          
          // Aggiorna il BehaviorSubject
          this.userSubject.next(user);
        }),
        catchError(this.handleError)
      );
  }
  
  logout(): void {
    // Usa il metodo helper per pulire tutto
    this.clearAuthData();
    this.userSubject.next(null);
  }

  updateProfile(data: { email?: string; firstName?: string; lastName?: string }): Observable<User> {
    /* 
     * Aggiorno le informazioni del profilo utente.
     * Dopo l'aggiornamento, salvo i nuovi dati sia in localStorage che in cookie
     * e aggiorno il BehaviorSubject.
     */
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

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<any> {
    /* 
     * Cambio la password dell'utente verificando prima
     * che la password corrente sia corretta
     */
    return this.http.put(`${this.apiUrl}/change-password`, data)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteAccount(): Observable<any> {
    /* 
     * Elimino l'account dell'utente in modo permanente.
     * Questa operazione rimuove tutti i dati associati all'utente.
     */
    return this.http.delete(`${this.apiUrl}/account`)
      .pipe(
        tap(() => {
          /* 
           * Dopo l'eliminazione, eseguo il logout
           * per pulire tutti i dati locali
           */
          this.logout();
        }),
        catchError(this.handleError)
      );
  }
  
  private loadUserFromStorage(): void {
    // Prova prima dai cookie, poi da localStorage
    const tokenFromCookie = this.getCookie('token');
    const userFromCookie = this.getCookie('user');
    
    if (tokenFromCookie && userFromCookie) {
      // Usa i dati dai cookie
      this.userSubject.next(JSON.parse(decodeURIComponent(userFromCookie)));
      return;
    }
    
    // Fallback a localStorage
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      this.userSubject.next(JSON.parse(user));
    }
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let userMessage = 'Autenticazione fallita. Riprova.';
    
    /* 
      Gestione Errore HTTP:
      1. Controlliamo lo stato 401 per le credenziali non valide.
      2. Usiamo il messaggio del backend (error.error.message) come fallback.
    */
    if (error.status === 401) {
      userMessage = 'Nome utente o password non validi.';
    } else if (error.error?.message) {
      userMessage = error.error.message;
    }
    
    console.error('Auth Service Error:', error);
    
    return throwError(() => userMessage);
  }

  /* 
   * ==========================================
   * GESTIONE COOKIE
   * ==========================================
   * Metodi helper per salvare/leggere/eliminare cookie
   * I cookie sono più sicuri del localStorage per dati sensibili
   * e possono essere configurati come HttpOnly dal backend
   */

  /**
   * Salva un valore in un cookie
   * @param name Nome del cookie
   * @param value Valore da salvare
   * @param days Giorni di validità (default 7)
   */
  private setCookie(name: string, value: string, days: number = 7): void {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    
    // SameSite=Strict per maggiore sicurezza contro CSRF
    // Secure richiede HTTPS in produzione
    document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/;SameSite=Strict`;
  }

  /**
   * Legge un valore da un cookie
   * @param name Nome del cookie da leggere
   * @returns Il valore del cookie o null se non esiste
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
   * Elimina un cookie
   * @param name Nome del cookie da eliminare
   */
  private deleteCookie(name: string): void {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }

  /**
   * Salva token e user sia in cookie che in localStorage per compatibilità
   * @param token Token JWT
   * @param user Dati utente
   */
  private saveAuthData(token: string, user: User): void {
    // Salva in localStorage (compatibilità)
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Salva anche in cookie (più sicuro)
    this.setCookie('token', token, 7);
    this.setCookie('user', JSON.stringify(user), 7);
  }

  /**
   * Rimuove tutti i dati di autenticazione
   */
  private clearAuthData(): void {
    // Rimuove da localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Rimuove dai cookie
    this.deleteCookie('token');
    this.deleteCookie('user');
  }
}