"use client"
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Product } from '@/Product/types'; // Update with your actual type path
import formattedData from '@/components/data'; // Import your data.ts

interface Transaction {
  productId: string;
  // Include any other transaction details you need
}

interface OrderHistoryItem {
  restaurantName: string;
  productName: string;
  productPrice: number;
  productImage: string;
}

const OrderPage: React.FC = () => {
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch transaction history from your API or database
    const fetchOrderHistory = async () => {
      try {
        // Example API endpoint; replace with your actual endpoint
        const response = await axios.get('/api/products');
        const transactions: Transaction[] = response.data;

        // Match transactions with products and restaurants
        const matchedOrderHistory: OrderHistoryItem[] = transactions.flatMap((transaction) => {
          // Find the restaurant that sells the product
          const restaurant = formattedData.find(restaurant =>
            restaurant.products.some(product => product.id === transaction.productId)
          );

          if (restaurant) {
            // Find the specific product
            const product = restaurant.products.find(product => product.id === transaction.productId);

            if (product) {
              return {
                restaurantName: restaurant.name,
                productName: product.name,
                productPrice: product.price,
                productImage: product.image,
              };
            }
          }

          return [];
        });

        setOrderHistory(matchedOrderHistory);
      } catch (error) {
        console.error('Failed to fetch order history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderHistory();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Order History</h1>
      {orderHistory.length > 0 ? (
        <ul>
          {orderHistory.map((item, index) => (
            <li key={index} className="mb-4 p-4 border rounded-lg">
              <h2 className="text-xl font-semibold">{item.restaurantName}</h2>
              <div className="flex items-center mt-2">
                <img src={item.productImage} alt={item.productName} className="w-24 h-24 object-cover mr-4" />
                <div>
                  <p className="text-lg">{item.productName}</p>
                  <p className="text-md text-gray-600">Price: GHS {item.productPrice}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No orders found.</p>
      )}
    </div>
  );
};

export default OrderPage;
