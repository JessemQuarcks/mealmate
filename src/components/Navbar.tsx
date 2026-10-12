"use client";
import Link from "next/link";
import React from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";

/**
 * Primary navigation. Role-aware: couriers, vendors and admins get a quick link
 * to their area. Rendered client-side (ssr:false) so the session read never
 * causes a hydration mismatch, matching the header components.
 */
const NavbarComponent = () => {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;

  const roleLink =
    role === "vendor"
      ? { href: "/vendor/dashboard", label: "VENDOR" }
      : role === "courier"
      ? { href: "/courier/dashboard", label: "DELIVER" }
      : role === "admin"
      ? { href: "/admin", label: "ADMIN" }
      : null;

  return (
    <div className="hidden lg:block border-b border-gray-100">
      <div className="container">
        <div className="flex w-fit gap-10 mx-auto font-medium py-4 text-blackish">
          <Link className="navbar_link relative" href="/home">HOME</Link>
          <Link className="navbar_link relative" href="/browse">BROWSE</Link>
          <Link className="navbar_link relative" href="/discover">MAP</Link>
          <Link className="navbar_link relative" href="/history">HISTORY</Link>
          <Link className="navbar_link relative" href="/help">HELP</Link>
          {roleLink && (
            <Link className="navbar_link relative text-accent" href={roleLink.href}>
              {roleLink.label}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

const Navbar = dynamic(() => Promise.resolve(NavbarComponent), { ssr: false });
export default Navbar;
