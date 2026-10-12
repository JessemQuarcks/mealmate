import React from "react";
import Link from "next/link";
import { BsFacebook, BsInstagram, BsLinkedin, BsTwitterX } from "react-icons/bs";

/** Site footer with quick links and socials. */
const Footer = () => {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50">
      <div className="container py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-2xl text-blackish">
            <b>Meal</b>mate
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Discover nearby restaurants, order, pay and track delivery — all in one place.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-blackish mb-3">Explore</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="/home" className="hover:text-accent">Home</Link></li>
            <li><Link href="/discover" className="hover:text-accent">Discover</Link></li>
            <li><Link href="/history" className="hover:text-accent">Order history</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-blackish mb-3">For partners</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="/vendor/dashboard" className="hover:text-accent">Vendor portal</Link></li>
            <li><Link href="/courier/dashboard" className="hover:text-accent">Courier app</Link></li>
            <li><Link href="/help" className="hover:text-accent">Help &amp; FAQ</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-blackish mb-3">Follow us</h3>
          <div className="flex gap-2">
            <span className="header_top_icon_wrapper"><BsFacebook /></span>
            <span className="header_top_icon_wrapper"><BsTwitterX /></span>
            <span className="header_top_icon_wrapper"><BsInstagram /></span>
            <span className="header_top_icon_wrapper"><BsLinkedin /></span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} MealMate. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
