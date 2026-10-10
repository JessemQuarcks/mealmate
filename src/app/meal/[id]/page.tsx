import { notFound } from "next/navigation";
import Image from "next/image";
import React from "react";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import ProductCard from "@/components/ProductCard";
import { getRestaurantModel } from "@/models/restaurant";
import { effectiveItemPrice, isItemOrderable } from "@/lib/pricing";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

interface MealPageProps {
  params: { id: string };
}

async function findRestaurant(id: string) {
  const Restaurant = await getRestaurantModel();
  if (!Restaurant) return null;
  const or: Record<string, unknown>[] = [{ externalId: id }, { slug: id }];
  if (mongoose.Types.ObjectId.isValid(id)) or.unshift({ _id: id });
  return Restaurant.findOne({ $or: or }).lean();
}

const MealDetails = async ({ params }: MealPageProps) => {
  const meal = await findRestaurant(params.id);
  if (!meal) notFound();

  const { name, category, rating, imageUrl, menu } = meal;

  const products = (menu ?? [])
    .filter((item) => isItemOrderable(item))
    .map((item, index) => ({
      id: item.id ?? item.externalId ?? String(index),
      name: item.name,
      price: effectiveItemPrice(item).toString(),
      image: item.image ?? "/istockphoto-1277719283-612x612.jpg",
    }));

  const generatedRating = (value: number) => {
    const stars = Array(5)
      .fill(0)
      .map((_, index) =>
        index < value ? <AiFillStar key={index} /> : <AiOutlineStar key={index} />
      );
    return <div className="flex gap-1 text-[20px] text-[#FF9529]">{stars}</div>;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col items-center">
        {imageUrl && (
          <div className="w-full h-64 relative">
            <Image src={imageUrl} alt={name} className="rounded-lg" fill sizes="100" />
          </div>
        )}
        <h2 className="text-black text-2xl text-center md:text-4xl font-bold mt-4">{name}</h2>
        {category && <p className="text-gray-700 text-base md:text-lg mt-2">{category}</p>}
        <div>{generatedRating(Math.round(rating ?? 0))}</div>

        <div className="mt-4 w-full container mx-auto p-4">
          <h3 className="text-xl text-center font-semibold mb-2"><b>Products</b></h3>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">This restaurant hasn&apos;t added a menu yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MealDetails;
