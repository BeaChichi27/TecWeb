import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { HomeComponent } from './components/home/home.component';
import { RestListComponent } from './components/restaurants/restaurant-list/rest-list.component';
import { RestDetailComponent } from './components/restaurants/restaurant-detail/rest-detail.component';
import { RestFormComponent } from './components/restaurants/restaurant-form/rest-form.component';
import { RevFormComponent } from './components/reviews/review-form/rev-form.component';

export const routes: Routes = [
  
  { 
    path: '', 
    component: HomeComponent,
    title: 'FAKERESTAURANT - Home'
  },
  
  
  {
    path: 'login',
    component: LoginComponent,
    title: 'Login'
  },
  {
    path: 'register',
    component: RegisterComponent,
    title: 'Registrazione'
  },
  
  
  {
    path: 'restaurants',
    children: [
      {
        path: '',
        component: RestListComponent,
        title: 'Esplora Ristoranti'
      },
      {
        path: 'new',
        component: RestFormComponent,
        canActivate: [authGuard],
        title: 'Crea Nuovo Ristorante'
      },
      {
        path: ':id',
        component: RestDetailComponent,
        title: 'Dettaglio Ristorante'
      },
      {
        path: ':id/edit',
        component: RestFormComponent,
        canActivate: [authGuard],
        title: 'Modifica Ristorante'
      }
    ]
  },
  
  
  {
    path: 'reviews',
    children: [
      {
        path: 'new',
        component: RevFormComponent,
        canActivate: [authGuard],
        title: 'Scrivi Recensione'
      },
      {
        path: ':id/edit',
        component: RevFormComponent,
        canActivate: [authGuard],
        title: 'Modifica Recensione'
      }
    ]
  },
  
  
  {
    path: 'my-restaurants',
    component: RestListComponent,
    canActivate: [authGuard],
    title: 'I Miei Ristoranti',
    data: { personalList: true }
  },
  
  
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./components/auth/profile/profile.component')
      .then(m => m.ProfileComponent),
    title: 'Profilo Utente'
  },
  
  
  {
    path: '**',
    redirectTo: ''
  }
];
