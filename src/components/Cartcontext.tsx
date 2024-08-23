// // src/context/CartContext.tsx
// import React, { createContext, useContext, useEffect, useState, ReactNode, useReducer } from 'react';

// interface Product {
//   id: string;
//   name: string;
//   price: string;
//   image: string;
//   restaurant: string;
// }

// interface CartState {
//   items: Product[];
// }

// interface CartAction {
//   type: 'ADD_TO_CART' | 'REMOVE_FROM_CART' | 'INIT_CART';
//   payload: Product | string | Product[];
// }

// interface CartContextType {
//   state: CartState;
//   dispatch: React.Dispatch<CartAction>;
//   totalItems: number;
//   totalPrice: number;
// }

// const CartContext = createContext<CartContextType | undefined>(undefined);

// const cartReducer = (state: CartState, action: CartAction): CartState => {
//   switch (action.type) {
//     case 'ADD_TO_CART':
//       return {
//         ...state,
//         items: [...state.items, action.payload as Product],
//       };
//     case 'REMOVE_FROM_CART':
//       return {
//         ...state,
//         items: state.items.filter(item => item.id !== action.payload),
//       };
//     case 'INIT_CART':
//       return {
//         ...state,
//         items: action.payload as Product[],
//       };
//     default:
//       return state;
//   }
// };

// export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
//   const [state, dispatch] = useReducer(cartReducer, { items: [] });

//   useEffect(() => {
//     const storedCart = localStorage.getItem('cart');
//     if (storedCart) {
//       dispatch({ type: 'INIT_CART', payload: JSON.parse(storedCart) });
//     }
//   }, []);

//   useEffect(() => {
//     localStorage.setItem('cart', JSON.stringify(state.items));
//   }, [state.items]);

//   const totalItems = state.items.length;

//   const totalPrice = state.items.reduce((total, item) => {
//     const price = parseFloat(item.price.replace('GHS', ''));
//     return total + price;
//   }, 0);

//   return (
//     <CartContext.Provider value={{ state, dispatch, totalItems, totalPrice }}>
//       {children}
//     </CartContext.Provider>
//   );
// };

// export const useCart = () => {
//   const context = useContext(CartContext);
//   if (!context) {
//     throw new Error('useCart must be used within a CartProvider');
//   }
//   return context;
// };
