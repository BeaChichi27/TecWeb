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