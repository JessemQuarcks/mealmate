"use client";

import React from 'react';
import Slider from 'react-slick';
import Slide from './Slide';
import "slick-carousel/slick/slick-theme.css"
const Hero = () => {

    var settings = {
        dots: false,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        pauseOnHover: false,
      };

      const slideData =[
        {
            id: 0,
            img: "/fotia-pizzaman-771x267-1.png",
            title: "Hot Offers",
            mainTitle: "KFC Streetwise Package",
            price: "2km Away",
        },
        {
            id: 1,
            img: "/kfc-banner.webp",
            title: "Hot Offers",
            mainTitle: "KFC Family Pack",
            price: "5km Away",
        },
      ]

  return <div>
    <div className="relative container pt-6 lg:pt-0">
        <Slider {...settings}>
          {slideData.map((item)=>(
            <Slide
                key={item.id}
                img={item.img}
                title={item.title}
                mainTitle={item.mainTitle}
                price={item.price}
                />
          ))}
        </Slider>
    </div>
  </div>
}

export default Hero