// src/components/ProductCard.tsx
'use client'; // This directive is needed for client components

import React from 'react';
import Image from 'next/image';
import { useAppDispatch } from '@/lib/hook';
import { addToCart } from '@/lib/slice';
import dynamic from 'next/dynamic';

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
}

interface ProductCardProps {
  product: Product;
}

const ProductCardAdditon: React.FC<ProductCardProps> = ({ product }) => {
  const dispatch = useAppDispatch();

  const handleAddToCart = () => {
    dispatch(addToCart({
      id: product.id,
      image: product.image,
      price: parseFloat(product.price),
      name: product.name,
    })
);
    
  };

  return (
    <div
      className="flex flex-col md:flex-row items-center bg-white p-4 rounded-lg shadow-md w-full max-w-md"
      style={{ height: '150px' }}
    >
      <div className="w-full md:w-1/2 h-full">
        <Image 
          src={product.image} 
          alt={product.name} 
          width={150} 
          height={150} 
          className="rounded-md object-cover" 
          style={{ height: '100%', width: '100%' }}
        />
      </div>
      <div className="w-full md:w-1/2 flex flex-col items-center md:items-start justify-center p-4">
        <h4 className="text-lg font-medium mt-2">{product.name}</h4>
        <p className="text-gray-600 mt-1">{product.price}</p>
        <button 
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg"
          onClick={handleAddToCart}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};


const ProductCard =dynamic(()=>Promise.resolve(ProductCardAdditon),{ssr:false});

export default ProductCard;
