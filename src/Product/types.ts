// src/types.ts

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

export interface Restaurant {
  id: number;
  name: string;
  google_map_url: string;
  google_map_src: string;
  ratings: string;
  rating_by_person: string;
  category: string;
  address: string;
  current_opening_status: string;
  dine_in: string;
  dine_through: string;
  delivery_status: string;
  coord: {
    lng: number;
    lat: number;
  };
  products: Product[];
}

export interface Transaction {
  productId: string;
  // Add other fields as needed (e.g., transaction ID, date, etc.)
}

export interface OrderHistoryItem {
  restaurantName: string;
  productName: string;
  productPrice: number;
  productImage: string;
}
