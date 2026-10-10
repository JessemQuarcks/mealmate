"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/vendor/dashboard", label: "Overview" },
  { href: "/vendor/menu", label: "Menu" },
  { href: "/vendor/orders", label: "Orders" },
  { href: "/vendor/settings", label: "Settings" },
  { href: "/vendor/claim", label: "Claim a listing" },
];

export default function VendorNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-2 border-b pb-3 mb-6">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`px-3 py-1.5 rounded-lg text-sm ${
            pathname === l.href ? "bg-blue-600 text-white" : "hover:bg-gray-100"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
