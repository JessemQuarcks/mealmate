"use client";
import React from "react";

/**
 * A 3D ring of cards that rotates continuously (pauses on hover), inspired by
 * the reference site's carousel. Pure CSS 3D transforms — no library. Each card
 * sits on the surface of a cylinder; the inner wrapper spins on the Y axis.
 */
const CardRing: React.FC<{ images: string[]; radius?: number }> = ({ images, radius = 330 }) => {
  const count = images.length || 1;
  const angle = 360 / count;

  return (
    <div className="relative h-[440px] w-full select-none [perspective:1400px]">
      {/* Ambient glow behind the ring */}
      <div className="absolute inset-0 bg-radial-brand blur-2xl" />
      <div className="absolute inset-0 grid place-items-center">
        <div
          className="group relative h-[260px] w-[200px] preserve-3d animate-spin-y [animation-play-state:running] hover:[animation-play-state:paused]"
          style={{ transformStyle: "preserve-3d" }}
        >
          {images.map((src, i) => (
            <div
              key={i}
              className="absolute inset-0 overflow-hidden rounded-2xl border border-brand/30 bg-surface shadow-glow-sm"
              style={{ transform: `rotateY(${i * angle}deg) translateZ(${radius}px)` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                width={200}
                height={260}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CardRing;
