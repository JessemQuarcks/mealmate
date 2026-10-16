import Link from "next/link";
import React from "react";
import { AiFillStar } from "react-icons/ai";

interface PropsType {
  img: string;
  title: string;
  desc: string;
  rating: number | string;
  price: string;
  id: number | string;
}

/** Restaurant / meal card used across home, browse and featured rails. */
const MealCard: React.FC<PropsType> = ({ img, title, desc, rating, price, id }) => {
  const r = Number(rating);
  const ratingLabel = Number.isFinite(r) && r > 0 ? r.toFixed(1) : "New";
  return (
    <Link
      href={`/meal/${id}`}
      className="group block w-full overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-brand hover:shadow-glow"
    >
      <div className="relative h-44 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <span className="badge absolute left-3 top-3 bg-black/55 text-white backdrop-blur">
          {price}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold text-fg">{title}</h3>
          <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-brand">
            <AiFillStar /> {ratingLabel}
          </span>
        </div>
        <p className="mt-1 line-clamp-1 text-sm text-muted">{desc}</p>
      </div>
    </Link>
  );
};

export default MealCard;
