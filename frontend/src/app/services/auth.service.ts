import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private userSubject = new BehaviorSubject<User | null>(null);
  
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
    return localStorage.getItem('token');
  }
  
  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { username, email, password })
      .pipe(
        catchError(this.handleError)
      );
  }
  
  login(username: string, password: string): Observable<any> {
    return this.http.post<{token: string, userId: number}>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap(response => {
          /* 
          Salvo il token e le informazioni dell'utente nel localStorage.
          Questa logica viene eseguita solo in caso di successo.
          */
          localStorage.setItem('token', response.token);
          const user: User = {
            id: response.userId,
            username
          };
          localStorage.setItem('user', JSON.stringify(user));
          this.userSubject.next(user);
        }),
        catchError(this.handleError)
      );
  }
  
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.userSubject.next(null);
  }

  updateProfile(data: { email?: string; firstName?: string; lastName?: string }): Observable<User> {
    /* 
     * Aggiorno le informazioni del profilo utente.
     * Dopo l'aggiornamento, salvo i nuovi dati nel localStorage
     * e aggiorno il BehaviorSubject.
     */
    return this.http.put<User>(`${this.apiUrl}/profile`, data)
      .pipe(
        tap(updatedUser => {
          /* 
           * Salvo l'utente aggiornato nel localStorage
           * e notifico tutti i subscriber
           */
          localStorage.setItem('user', JSON.stringify(updatedUser));
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
}