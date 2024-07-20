import React from 'react';

interface Product {
  name: string;
  price: string;
  image: string;
}

interface Restaurant {
  name: string;
  category: string;
  ratings: number;
  google_map_src: string;
  products: Product[];
}

interface PopUpProps {
  restaurant: Restaurant;
  onClose: () => void;
}

const PopUp: React.FC<PopUpProps> = ({ restaurant, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-white p-5 rounded-lg shadow-lg max-w-3xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{restaurant.name}</h2>
          <button onClick={onClose} className="text-red-500 font-bold">X</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {restaurant.products.map((product, index) => (
            <div key={index} className="p-4 border rounded-lg flex flex-col items-center">
              <img src={product.image} alt={product.name} className="w-32 h-32 object-cover mb-2" />
              <h3 className="text-lg font-medium">{product.name}</h3>
              <p className="text-gray-500 mb-2">{product.price}</p>
              <button className="bg-blue-500 text-white px-4 py-2 rounded">Add to Cart</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PopUp;
