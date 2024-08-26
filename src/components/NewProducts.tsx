"use client";
import React, {useEffect} from 'react';
import MealCard from './MealCard';
import formattedData from './data';

const NewProducts = () => {
  // interface Product {
  //   id: string;
  //   name: string;
  //   price: number;
  //   image: string;
  // }
  
  // interface ProductProp {
  //   id: number;
  //   products: Product[];
  // }

  // useEffect(() => {
  //   const handlePost = async (data: ProductProp) => {
  //     try {
  //       const res = await fetch('/api/products', {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify(data),
  //       });

  //       if (!res.ok) {
  //         console.log("Error connecting to database");
  //       }

  //       const { message } = await res.json();
  //       console.log("Return response: ", message.join(","));
  //     } catch (error) {
  //       console.log("Error occurred while posting the data to the database", error);
  //     }
  //   };

    
  //   // const data = {
  //   //   products: [
  //   //     {
  //   //       id: '29',
  //   //       name: 'Meal 1',
  //   //       price: 10,
  //   //       image: '/pizza-with-pineapple-and-thin-crust.webp',
  //   //     },
  //   //     {
  //   //       id: '30',
  //   //       name: 'Meal 2',
  //   //       price: 12,
  //   //       image: '/nasi-goreng-fried-rice.webp',
  //   //     },
  //   //   ],
  //   //   id: 15,
  //   // };


  //   setTimeout(() => {
  //     formattedData.map(({products, id}) => {
  //       const data = {products, id}
  //       handlePost(data);
  //     })

  //   }, 5000)
  // }, []);

  // interface Restaurant {
  //   id: number;
  //   name: string;
  // }
  
  // useEffect(() => {
  //   const handlePost = async (data: Restaurant) => {
  //     try {
  //       const res = await fetch('/api/restaurants', {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify(data),
  //       });

  //       if (!res.ok) {
  //         console.log("Error connecting to database");
  //       }

  //       const { message } = await res.json();
  //       console.log("Return response: ", message.join(","));
  //     } catch (error) {
  //       console.log("Error occurred while posting the data to the database", error);
  //     }
  //   };

  //   setTimeout(() => {
  //     formattedData.map(({id, name}) => {
  //       const data = {id, name}
  //       handlePost(data);
  //     })

  //   }, 5000)


  // });

  

  return (
    <div className="relative flex flex-col m-5 bg-white p-10">
      <h2 className="font-large text-2xl text-center pb-10 pl-10 sm:pl-5 lg:align-center xsm:align-center"><b>HOT OFFERS</b></h2>
      <div className="grid grid-cols-1 place-items-center sm:place-items-start sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5 xl:gap-x-5 xl:gap-y-5 sm:mb-20">
        {formattedData.map((item, index) => (
          <MealCard
            key={index}
            img={item.google_map_src}
            title={item.name}
            desc={item.category}
            rating={item.ratings}
            price={"8km Away"}
            id={item.id}
          />
        ))}
      </div>
    </div>
  );
}

export default NewProducts;
