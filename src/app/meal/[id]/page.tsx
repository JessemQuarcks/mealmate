// src/app/meal/[id]/page.tsx
import { notFound } from 'next/navigation';
import Image from 'next/image';
import React from 'react';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';
import formattedData from '../../../components/data'; // Adjust the path based on your directory structure
import ProductCard from '@/components/ProductCard';
import dynamic from 'next/dynamic';

interface Product {
  id: string;
  name: string;
  price: string; // Ensure price is consistent
  image: string;
}

interface Restaurant {
  id: number;
  name: string;
  category: string;
  ratings: number;
  google_map_src: string;
  products: Product[];
}

interface MealPageProps {
  params: {
    id: string;
  };
}

export async function generateStaticParams() {
  const paths = formattedData.map((meal) => ({
    id: meal.id.toString(),
  }));

  return paths;
}

const MetailDetailsComponent: React.FC<MealPageProps> = ({ params }) => {
  const meal = formattedData.find((meal) => meal.id.toString() === params.id);

  if (!meal) {
    notFound();
  }

  const { id, name, category, ratings, google_map_src, products } = meal;
  const prod = products.map(({id, name, price, image}) => {
     return {
      id,
      name,
      price: price.toString(),
      image
     }
  })

  const generatedRating = (rating: number) => {
    const stars = Array(5)
      .fill(<AiOutlineStar />)
      .map((star, index) => {
        if (index < rating) {
          return <AiFillStar key={index} />;
        }
        return <AiOutlineStar key={index} />;
      });

    return <div className="flex gap-1 text-[20px] text-[#FF9529]">{stars}</div>;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col items-center">
        <div className="w-full h-64 relative">
          <Image
            src={google_map_src}
            alt={name}
            className="rounded-lg"
            fill
            sizes='100'
          />
        </div>
        <h2 className="text-black text-2xl text-center md:text-4xl font-bold mt-4">{name}</h2>
        <p className="text-gray-700 text-base md:text-lg mt-2">{category}</p>
        <div>{generatedRating(+ratings)}</div>
        <div className="mt-4 w-full container mx-auto p-4">
          <h3 className="text-xl text-center font-semibold mb-2"><b>Products</b></h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {prod.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


const MealDetails =dynamic(()=>Promise.resolve(MetailDetailsComponent),{ssr:false});
export default MealDetails;
