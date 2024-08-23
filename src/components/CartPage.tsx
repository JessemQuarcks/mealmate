// // src/app/Checkout/page.tsx
// import React from 'react';
// import { useCart } from './Cartcontext';
// import Image from 'next/image';

// // const Checkout = () => {
// //   const { cart, removeFromCart, totalPrice } = useCart();

//   return (
//     <div className="container mx-auto p-4">
//       <h2 className="text-2xl font-bold mb-4">Your Cart</h2>
//       {cart.length === 0 ? (
//         <p>Your cart is empty.</p>
//       ) : (
//         <>
//           <div className="grid grid-cols-1 gap-4">
//             {cart.map((item) => (
//               <div key={item.id} className="flex items-center bg-white p-4 rounded-lg shadow-md">
//                 <div className="w-1/2">
//                   <Image src={item.image} alt={item.name} width={150} height={150} className="rounded-md object-cover" />
//                 </div>
//                 <div className="w-1/2 p-4">
//                   <h4 className="text-lg font-medium">{item.name}</h4>
//                   <p className="text-gray-600">{item.price}</p>
//                   <p className="text-gray-600">{item.restaurant}</p>
//                   <button className="mt-2 bg-red-500 text-white px-4 py-2 rounded-lg" onClick={() => removeFromCart(item.id)}>
//                     Remove
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//           <div className="mt-4">
//             <h3 className="text-xl font-semibold">Total: GHS{totalPrice.toFixed(2)}</h3>
//             <button className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg">Proceed to Checkout</button>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default Checkout;
