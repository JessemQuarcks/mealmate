"use client";
import React, { useEffect, useState } from "react";

interface Review {
  stars: number;
  comment?: string;
  at: string | null;
}

interface ReviewsData {
  average: number | null;
  count: number;
  reviews: Review[];
}

const Stars: React.FC<{ value: number }> = ({ value }) => (
  <span className="text-[#FF9529]">
    {"★".repeat(Math.round(value))}
    {"☆".repeat(Math.max(0, 5 - Math.round(value)))}
  </span>
);

/** Recent customer reviews for a restaurant, from delivered-order ratings. */
const RestaurantReviews: React.FC<{ restaurantId: string }> = ({ restaurantId }) => {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/restaurants/${restaurantId}/reviews`, { cache: "no-store" })
      .then((r) => r.json())
      .then((b) => active && setData(b?.data ?? null))
      .catch(() => active && setData(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [restaurantId]);

  if (loading) return <p className="text-muted text-sm">Loading reviews…</p>;
  if (!data || data.count === 0)
    return <p className="text-muted text-sm">No reviews yet — be the first after your order.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">{data.average?.toFixed(1)}</span>
        {data.average != null && <Stars value={data.average} />}
        <span className="text-sm text-muted">({data.count} reviews)</span>
      </div>
      <ul className="space-y-3">
        {data.reviews.map((r, i) => (
          <li key={i} className="card">
            <Stars value={r.stars} />
            {r.comment && <p className="mt-1 text-sm text-muted">{r.comment}</p>}
            {r.at && (
              <p className="mt-1 text-xs text-muted">
                {new Date(r.at).toLocaleDateString()}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RestaurantReviews;
