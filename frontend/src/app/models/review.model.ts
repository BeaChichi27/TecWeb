export interface Review {
  id: number;
  restaurantId: number;
  userId: number;
  username: string;
  content: string;
  rating: number;
  upvotes: number;
  downvotes: number;
  userVote?: number; // -1 per downvote, 0 per nessun voto, 1 per upvote
  createdAt: string;
  updatedAt?: string;
}

export interface CreateReviewDto {
  restaurantId: number;
  content: string;
  rating: number;
}

export interface UpdateReviewDto {
  content?: string;
  rating?: number;
}