export interface User {
  id: number;
  username: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
  restaurantsCount?: number;
  reviewsCount?: number;
}

export interface UserProfile extends User {
  bio?: string;
  avatarUrl?: string;
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