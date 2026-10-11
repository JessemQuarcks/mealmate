import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CartItem {
    id: string;
    image: string;
    price: number;
    name: string;
    quantity: number;
}



interface BoughtItems{
    id: string;
    image: string;
    price: number;
    name: string;
    quantity: number;
}

interface CartState {
    cartItems: CartItem[];
    quantity: number;
    itemAlreadyInCart: boolean;
    totalCost: number;
    boughtItems:CartItem[];
    // A cart belongs to exactly one restaurant; checkout is per-vendor.
    restaurantId: string | null;
}

// addToCart may carry the restaurant the item belongs to, so the cart can be
// bound to a single vendor (Phase 4).
type AddToCartPayload = CartItem & { restaurantId?: string };

const initialState: CartState = {
    cartItems: [],
    quantity: 0,
    itemAlreadyInCart: false,
    totalCost: 0,
    boughtItems:[],
    restaurantId: null,

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
        addToCart: (state, action: PayloadAction<AddToCartPayload>) => {
            const { id, image, price, name, quantity, restaurantId } = action.payload;
            // Switching restaurants empties the cart: a cart is single-vendor.
            if (restaurantId && state.restaurantId && state.restaurantId !== restaurantId) {
                state.cartItems = [];
                state.quantity = 0;
            }
            if (restaurantId) state.restaurantId = restaurantId;
            const existingItem = state.cartItems.find((item) => item.id === id);
            if (existingItem) {
                // Update quantity if item already exists
                existingItem.quantity = quantity;
            } else {
                state.cartItems.push({
                    id, 
                    image, 
                    price, 
                    name, 
                    quantity // Use quantity from action payload
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
            state.restaurantId = null;
            saveCartToStorage(state); // Save the cleared state to local storage
        },
        
        increaseItemQty: (state, action: PayloadAction<string>) => {
            const id = action.payload;
            const item = state.cartItems.find((el: CartItem) => el.id === id);
            if (item) {
                item.quantity += 1;
            }
            saveCartToStorage(state); // Save the updated state to local storage
        },
        addToBought: (state, action: PayloadAction<CartItem[]>) => {
            console.log("Adding to bought Items")
            // Add all cart items to the boughtItems list
            state.boughtItems = action.payload;
            console.log(state.boughtItems)
            saveCartToStorage(state); // Save the updated state to local storage
        },
    
        decreaseItemQty: (state, action: PayloadAction<string>) => {
            const id = action.payload;
            const item = state.cartItems.find((el: CartItem) => el.id === id);
            if (item && item.quantity > 1) {
                item.quantity -= 1;
            }
            saveCartToStorage(state); // Save the updated state to local storage
        },

        calculateTotal: (state) => {
            state.totalCost = state.cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
        },

    },
});

export const { addToCart, removeFromCart, clearCart, increaseItemQty, decreaseItemQty, calculateTotal, addToBought } = cartSlice.actions;
export const cartItems = (state: any) => state.cart.cartItems;
export const totalCost = (state: any) => state.cart.totalCost;
export const boughtItems = (state:any)=> state.cart.boughtItems;
export const cartRestaurantId = (state: any) => state.cart.restaurantId;
export default cartSlice.reducer;
