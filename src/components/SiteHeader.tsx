"use client";
import React, { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  FiHome,
  FiCompass,
  FiMap,
  FiClock,
  FiHelpCircle,
  FiShoppingBag,
  FiUser,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { useAppSelector } from "@/lib/hook";
import ThemeToggle from "@/components/ThemeToggle";

const NAV = [
  { href: "/home", label: "Home", icon: FiHome },
  { href: "/browse", label: "Browse", icon: FiCompass },
  { href: "/discover", label: "Map", icon: FiMap },
  { href: "/history", label: "Orders", icon: FiClock },
  { href: "/help", label: "Help", icon: FiHelpCircle },
];

const SiteHeaderComponent: React.FC = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const cartCount = useAppSelector((s) => s.cart.quantity);
  const [open, setOpen] = useState(false);

  const role = (session?.user as { role?: string } | undefined)?.role;
  const accountHref = session?.user ? "/account" : "/signin";
  const roleLink =
    role === "vendor"
      ? { href: "/vendor/dashboard", label: "Vendor" }
      : role === "courier"
      ? { href: "/courier/dashboard", label: "Deliver" }
      : role === "admin"
      ? { href: "/admin", label: "Admin" }
      : null;

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 border-b border-line/60 bg-bg/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/home" className="flex items-center gap-2 font-display text-xl font-extrabold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-black shadow-glow-sm">
            M
          </span>
          <span className="hidden sm:inline">
            Meal<span className="text-brand">mate</span>
          </span>
        </Link>

        {/* Center floating pill nav */}
        <nav className="hidden lg:flex items-center gap-1 rounded-full border border-line bg-surface/50 p-1.5 backdrop-blur-xl">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                isActive(href)
                  ? "bg-brand text-black shadow-glow-sm"
                  : "text-muted hover:bg-surface-2 hover:text-fg"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/Checkout"
            aria-label="Cart"
            className="relative grid h-10 w-10 place-items-center rounded-full border border-line bg-surface/60 text-fg transition-colors hover:text-brand"
          >
            <FiShoppingBag size={18} />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-brand text-[11px] font-bold text-black">
                {cartCount}
              </span>
            )}
          </Link>
          <Link href={accountHref} className="hidden sm:inline-flex btn-outline">
            <FiUser size={16} />
            {session?.user ? "Account" : "Sign in"}
          </Link>
          {roleLink && (
            <Link href={roleLink.href} className="hidden lg:inline-flex btn-primary">
              {roleLink.label}
            </Link>
          )}
          {/* Mobile menu button */}
          <button
            className="lg:hidden grid h-10 w-10 place-items-center rounded-full border border-line bg-surface/60 text-fg"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <FiMenu size={18} />
          </button>
        </div>
      </div>

      {/* Mobile overlay menu */}
      {open && (
        <div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-xl lg:hidden animate-fade-in">
          <div className="container flex h-16 items-center justify-between">
            <span className="font-display text-xl font-extrabold">
              Meal<span className="text-brand">mate</span>
            </span>
            <button
              className="grid h-10 w-10 place-items-center rounded-full border border-line"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <FiX size={18} />
            </button>
          </div>
          <nav className="container mt-6 flex flex-col gap-2">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-lg font-medium ${
                  isActive(href) ? "bg-brand text-black" : "bg-surface text-fg"
                }`}
              >
                <Icon size={20} />
                {label}
              </Link>
            ))}
            <Link
              href={accountHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-lg font-medium"
            >
              <FiUser size={20} />
              {session?.user ? "Account" : "Sign in"}
            </Link>
            {roleLink && (
              <Link
                href={roleLink.href}
                onClick={() => setOpen(false)}
                className="btn-primary mt-2 w-full"
              >
                Go to {roleLink.label}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

const SiteHeader = dynamic(() => Promise.resolve(SiteHeaderComponent), { ssr: false });
export default SiteHeader;
