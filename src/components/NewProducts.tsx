"use client";
import React from 'react';
import MealCard from './MealCard';
import formattedData from './data';

const NewProducts = () => {
  return (
    <div className="relative flex flex-col m-5 bg-white p-10">
      <h2 className="font-medium text-2xl pb-10 pl-10 sm:pl-5 xsm:align-center">RECENTLY VISITED</h2>
      <div className="grid grid-cols-1 place-items-center sm:place-items-start sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5 xl:gap-x-5 xl:gap-y-5 sm:mb-20">
        {formattedData.map((item, index) => (
          <MealCard
            key={index}
            img={item.google_map_src}
            title={item.name}
            desc={item.category}
            rating={item.ratings}
            price={"8km Away"}
          />
        ))}
      </div>
    </div>
  );
}

export default NewProducts;
