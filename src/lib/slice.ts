import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CartItem {
    id: string;
    image: string;
    price: number;
    name: string;
}

interface CartState {
    cartItems: CartItem[];
    quantity: number;
}

const initialState: CartState = {
    cartItems: [],
    quantity: 0,
};

// Load the items from local storage
const loadCartFromStorage = (): CartState => {
    if (typeof window !== 'undefined') {
        const cartData = localStorage.getItem('cart');
        return cartData ? JSON.parse(cartData) : initialState;
    }
    return initialState;
};

// Save the items to local storage
const saveCartToStorage = (state: CartState) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(state));
    }
};

// Create a cart slice
const cartSlice = createSlice({
    name: 'cart',
    initialState: loadCartFromStorage(),
    reducers: {
        addToCart: (state, action: PayloadAction<CartItem>) => {
            const { id, image, price, name } = action.payload;
            const existingItem = state.cartItems.find((item) => item.id === id);
            if (existingItem) {
                state.quantity++;
            } else {
                state.cartItems.push({
                    id, image, name, price,
                });
                state.quantity++;
            }
            saveCartToStorage(state); // Save the updated state to local storage
        },
        removeFromCart: (state, action: PayloadAction<string>) => {
            const id = action.payload;
            state.cartItems = state.cartItems.filter((item) => item.id !== id);
            state.quantity = state.cartItems.length;
            saveCartToStorage(state); // Save the updated state to local storage
        },
        clearCart: (state) => {
            state.cartItems = [];
            state.quantity = 0;
            saveCartToStorage(state); // Save the cleared state to local storage
        }
    },
});

export const { addToCart, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
