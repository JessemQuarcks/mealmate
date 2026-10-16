import React from "react";
import Link from "next/link";
import { BsFacebook, BsInstagram, BsLinkedin, BsTwitterX } from "react-icons/bs";

const Footer = () => {
  return (
    <footer className="mt-24 border-t border-line bg-surface/40">
      <div className="container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-display text-2xl font-extrabold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-black">M</span>
            Meal<span className="text-brand">mate</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted">
            Discover nearby restaurants, order, pay and watch your delivery arrive —
            all in one beautifully fast place.
          </p>
        </div>

        <FooterCol
          title="Explore"
          links={[
            ["Home", "/home"],
            ["Browse", "/browse"],
            ["Map", "/discover"],
            ["Your orders", "/history"],
          ]}
        />
        <FooterCol
          title="For partners"
          links={[
            ["Vendor portal", "/vendor/dashboard"],
            ["Courier app", "/courier/dashboard"],
            ["Help & FAQ", "/help"],
          ]}
        />

        <div>
          <h3 className="mb-3 font-semibold text-fg">Follow us</h3>
          <div className="flex gap-2">
            <span className="header_top_icon_wrapper"><BsFacebook /></span>
            <span className="header_top_icon_wrapper"><BsTwitterX /></span>
            <span className="header_top_icon_wrapper"><BsInstagram /></span>
            <span className="header_top_icon_wrapper"><BsLinkedin /></span>
          </div>
          <Link href="/browse" className="btn-primary mt-5 inline-flex">
            Start ordering
          </Link>
        </div>
      </div>

      <div className="border-t border-line py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} Mealmate. Crafted with care.
      </div>
    </footer>
  );
};

const FooterCol: React.FC<{ title: string; links: [string, string][] }> = ({ title, links }) => (
  <div>
    <h3 className="mb-3 font-semibold text-fg">{title}</h3>
    <ul className="space-y-2 text-sm text-muted">
      {links.map(([label, href]) => (
        <li key={href}>
          <Link href={href} className="transition-colors hover:text-brand">
            {label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export default Footer;
