export interface Restaurant {
  id: number;
  name: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  imageUrl?: string;
  imagePath?: string;
  ownerId: number;
  ownerUsername?: string;
  createdAt: string;
  updatedAt?: string;
  reviewsCount?: number;
  averageRating?: number;
}

export interface CreateRestaurantDto {
  name: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  image?: File;
}

export interface UpdateRestaurantDto {
  name?: string;
  description?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  image?: File;
}