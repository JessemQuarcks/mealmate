"use client";
import Hero from '@/components/Hero';
import NewProducts from '@/components/NewProducts';
import React, { useEffect } from 'react';


const Home = () => {
  return (
    <div>
      <Hero />
      <NewProducts />
    </div>
  );
};

export default Home;
