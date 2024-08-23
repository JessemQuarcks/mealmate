import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './slice'; // Adjust the path if necessary

export const store =()=> configureStore({
    reducer: {
        cart: cartReducer,
    },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type AppStore = ReturnType<typeof store>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch'];
