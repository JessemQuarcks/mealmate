import Image from 'next/image';
import React from 'react';

interface propsType {
    img: string;
    title: string;
    mainTitle: string;
    price: string;
}

const Slide: React.FC<propsType> = ({ img, title, mainTitle, price }) => {
  return (
    <div className="relative flex justify-center place-items-center w-full h-[300px] md:h-[400px] overflow-hidden">
      <Image
        className="w-full h-full object-cover object-center rounded-xl"
        src={img}
        alt="banner"
        // width={1000}
        // height={1000}
        // objectFit="cover"
        fill
        priority
        sizes='1000'
      />
      <div className="absolute inset-0 flex flex-col justify-center items-start p-3 sm:p-6 bg-gradient-to-r from-black/50 via-black/30 to-transparent">
        <h3 className="text-accent text-[20px] lg:text-[24px] mb-1">{title}</h3>
        <h2 className="text-white text-[24px] md:text-[28px] lg:text-[32px] font-bold mb-1 leading-tight">{mainTitle}</h2>
        <h3 className="text-[20px] text-gray-300 mb-2">Price: <b className="text-[20px] md:text-[24px] lg:text-[28px]">{price}</b></h3>
        <div className="bg-accent text-white text-[12px] md:text-[14px] p-2 px-4 rounded-lg inline-block cursor-pointer hover:bg-blackish">Visit Now</div>
      </div>
    </div>
  );
}

export default Slide;
