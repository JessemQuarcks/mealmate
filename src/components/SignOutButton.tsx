"use client";
import { signOut } from "next-auth/react";
import { FiLogOut } from "react-icons/fi";

export default function SignOutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: "/home" })} className="btn-outline">
      <FiLogOut size={16} /> Sign out
    </button>
  );
}
