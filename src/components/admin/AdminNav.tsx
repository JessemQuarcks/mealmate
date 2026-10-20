"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiGrid,
  FiUsers,
  FiShoppingBag,
  FiMapPin,
  FiDollarSign,
  FiSliders,
} from "react-icons/fi";

const LINKS = [
  { href: "/admin", label: "Overview", icon: FiGrid, exact: true },
  { href: "/admin/users", label: "Users", icon: FiUsers },
  { href: "/admin/orders", label: "Orders", icon: FiShoppingBag },
  { href: "/admin/restaurants", label: "Catalogue", icon: FiMapPin },
  { href: "/admin/payouts", label: "Payouts", icon: FiDollarSign },
  { href: "/admin/settings", label: "Settings", icon: FiSliders },
];

const AdminNav: React.FC = () => {
  const pathname = usePathname();
  const active = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname?.startsWith(href + "/");

  return (
    <nav className="no-scrollbar mb-6 flex gap-1 overflow-x-auto rounded-full border border-line bg-surface/50 p-1.5 backdrop-blur-xl">
      {LINKS.map(({ href, label, icon: Icon, exact }) => (
        <Link
          key={href}
          href={href}
          className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
            active(href, exact)
              ? "bg-brand text-black shadow-glow-sm"
              : "text-muted hover:bg-surface-2 hover:text-fg"
          }`}
        >
          <Icon size={16} />
          {label}
        </Link>
      ))}
    </nav>
  );
};

export default AdminNav;
