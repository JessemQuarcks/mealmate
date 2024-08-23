"use client"
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAppDispatch } from '@/lib/hook';
import { addToCart } from '@/lib/slice';
import dynamic from 'next/dynamic';
import { useSelector } from 'react-redux';
import { cartItems } from '@/lib/slice';

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
  const [quantity, setQuantity] = useState<number>(1);
  const [itemAlreadyInCart, setItemAlreadyInCart] = useState<boolean>(false);

  const dispatch = useAppDispatch();
  const items = useSelector(cartItems);
  
  // Check if product already exists in cart
  const itemExist = (id: string): boolean => {
    const existingItem = items.find((item: any) => item.id === id);
    return existingItem !== undefined;
  };

  useEffect(() => {
    setItemAlreadyInCart(itemExist(product.id));
  }, [items, product.id]);

  const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value > 0) {
      setQuantity(value);
    }
  };

  const handleAddToCart = () => {
    dispatch(addToCart({
        id: product.id,
        image: product.image,
        price: parseFloat(product.price),
        name: product.name,
        quantity, // Pass the quantity from state
    }));
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
        <div className="flex items-center mt-2">
          <input 
            type="number"
            value={quantity}
            onChange={handleQuantityChange}
            min="1"
            className="w-16 text-center border border-gray-300 rounded-md py-1 px-2"
          />
        </div>
        <button 
          disabled={itemAlreadyInCart} 
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg"
          onClick={handleAddToCart}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

const ProductCard = dynamic(() => Promise.resolve(ProductCardAdditon), { ssr: false });

export default ProductCard;
