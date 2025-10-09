export interface User {
  id: number;
  username: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
  // Questi campi potrebbero essere utili per statistiche utente
  restaurantsCount?: number;
  reviewsCount?: number;
}

export interface UserProfile extends User {
  // Campi estesi che potrebbero essere utili per una pagina profilo
  bio?: string;
  avatarUrl?: string;
  // Dati aggregati per il profilo utente
  totalUpvotesReceived?: number;
  totalDownvotesReceived?: number;
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  password?: string;
  bio?: string;
  avatar?: File;
}