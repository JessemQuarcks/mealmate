import Image from 'next/image';
import React from 'react';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';

interface propsType {
    img: string;
    title: string;
    desc: string;
    rating: number | string;
    price: string;
}

const MealCard: React.FC<propsType> = ({ img, title, desc, rating, price }) => {
    const generatedRating = (rating: number) => {
        const stars = Array(5).fill(<AiOutlineStar />).map((star, index) => {
            if (index < rating) {
                return <AiFillStar key={index} />;
            }
            return <AiOutlineStar key={index} />;
        });

        return (
            <div className="flex gap-1 text-[20px] text-[#FF9529]">
                {stars}
            </div>
        );
    };

    return (
        <div className="relative w-[250px] h-[350px] rounded-xl overflow-hidden shadow-lg bg-white">
            <div className="h-1/2 relative">
                <Image
                    src={img}
                    alt={title}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-t-xl"
                />
            </div>
            <div className="h-1/2 flex flex-col justify-center items-start p-4">
                <h2 className="text-black text-lg md:text-xl font-bold mb-1">{title}</h2>
                <p className="text-gray-700 text-sm md:text-base mb-1">{desc}</p>
                <div>{generatedRating(+rating)}</div>
                <p className="text-gray-600 text-sm mt-2">{price}</p>
            </div>
        </div>
    );
}

export default MealCard;
