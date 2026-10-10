"use client";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/home" })}
      className="border rounded-lg px-4 py-2 hover:bg-gray-50"
    >
      Sign out
    </button>
  );
}
