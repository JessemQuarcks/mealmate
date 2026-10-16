"use client";
import { SessionProvider } from "next-auth/react";
import StoreProvider from "./StoreProvider";
import { ThemeProvider } from "./ThemeProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <StoreProvider>{children}</StoreProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
