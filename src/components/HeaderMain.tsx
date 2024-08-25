// src/components/HeaderMain.tsx
"use client";
import React from 'react';
import { BiUser } from 'react-icons/bi';
import { BsSearch } from 'react-icons/bs';
import { FiHeart } from 'react-icons/fi';
import { HiOutlineShoppingBag } from 'react-icons/hi';
import Link from 'next/link';
import { signIn } from "next-auth/react";
// import { useCart } from '../components/Cartcontext';
import { useAppSelector } from '@/lib/hook';
import dynamic from 'next/dynamic';

const HeaderMainComponent = () => {
  // const { totalItems } = useCart();
  const cartItems=useAppSelector(state=>state.cart.quantity);

  const handleSignIn = async () => {
    try {
      await signIn('google');
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  return (
    <div className="z-50 border-b border-gray-200 py-6">
      <div className="container sm:flex justify-between items-center">
        <Link href="/home" className="text-4xl text-center pb-4 sm:pb-0 text-blackish pl-2">
          <b>Meal</b>mate
        </Link>
        <div className="w-full sm:w-[300px] md:w-[70%] relative">
          <input
            className="border-gray-200 border p-2 px-4 rounded-lg w-full"
            type="text"
            placeholder="Enter any Meal of Choice..."
          />
          <BsSearch className="absolute right-0 top-0 mr-3 mt-3 text-gray-400" size={20} />
        </div>
        <div className="hidden lg:flex gap-4 text-gray-500 text-[30px]">
          <div onClick={handleSignIn} className="cursor-pointer">
            <BiUser />
          </div>
          <div className="relative">
            <FiHeart />
            <div className="bg-red-600 rounded-full absolute top-0 right-0 w-[18px] h-[18px] text-[12px] text-white grid place-items-center translate-x-1 -translate-y-1">
              0
            </div>
          </div>
          <div className="relative">
            <Link href="/Checkout">
              <HiOutlineShoppingBag />
              <div className="bg-red-600 rounded-full absolute top-0 right-0 w-[18px] h-[18px] text-[12px] text-white grid place-items-center translate-x-1 -translate-y-1">
                {cartItems}
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const HeaderMain=dynamic(()=>Promise.resolve(HeaderMainComponent),{ssr:false});

export default HeaderMain;
