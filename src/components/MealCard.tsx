import Image from "next/image";
import Link from "next/link";
import React from "react";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";

interface PropsType {
  img: string;
  title: string;
  desc: string;
  rating: number | string;
  price: string;
  id: number;
}

const MealCard: React.FC<PropsType> = ({
  img,
  title,
  desc,
  rating,
  price,
  id,
}) => {
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
    <div
      className="relative w-[250px] h-[350px] rounded-xl overflow-hidden shadow-lg bg-white cursor-pointer"
    >
      <Link href={`/meal/${id}`}>
        <div className="h-1/2 relative">
          <Image
            src={img}
            alt={title}
            className="rounded-t-xl"
            fill
            sizes="100"
          />
        </div>
        <div className="h-1/2 flex flex-col justify-center items-start p-4">
          <h2 className="text-black text-lg md:text-xl font-bold mb-1">
            {title}
          </h2>
          <p className="text-gray-700 text-sm md:text-base mb-1">{desc}</p>
          <div>{generatedRating(+rating)}</div>
          <p className="text-gray-600 text-sm mt-2">{price}</p>
        </div>
      </Link>
    </div>
  );
};

export default MealCard;
