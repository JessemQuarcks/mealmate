import React from "react";
import Link from "next/link";
import {
  FiSearch,
  FiCreditCard,
  FiMapPin,
  FiArrowRight,
  FiZap,
  FiShoppingBag,
} from "react-icons/fi";
import CardRing from "@/components/landing/CardRing";
import Reveal from "@/components/landing/Reveal";
import FeaturedRestaurants from "@/components/landing/FeaturedRestaurants";
import LandingDiscovery from "@/components/landing/LandingDiscovery";

const RING_IMAGES = [
  "/juicy-cheeseburger.webp",
  "/pizza-salami.webp",
  "/fried-rice-with-egg-and-spring-onion.webp",
  "/grilled-crispy-pork-with-rice.webp",
  "/Fried Yam.webp",
  "/meat-rice-broccoli.webp",
  "/nasi-goreng-fried-rice.webp",
  "/bowl-of-ice-cream-with-chocolate.webp",
];

const STEPS = [
  {
    icon: FiSearch,
    title: "Browse & discover",
    body: "Find nearby restaurants ranked by rating, speed, price and live offers.",
  },
  {
    icon: FiCreditCard,
    title: "Order & pay securely",
    body: "Server-verified Paystack checkout — prices computed on our side, never guessed.",
  },
  {
    icon: FiMapPin,
    title: "Track it live",
    body: "Watch your courier move on the map with a real-time ETA until it's at your door.",
  },
];

const STATS = [
  { value: "500+", label: "Dishes nearby" },
  { value: "~25 min", label: "Avg delivery" },
  { value: "100%", label: "Verified payments" },
];

const Landing: React.FC = () => {
  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-70" />
        <div className="pointer-events-none absolute -right-40 top-0 h-[600px] w-[600px] bg-radial-brand blur-2xl" />

        <div className="container relative grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div className="animate-fade-up">
            <span className="chip">
              <FiZap className="text-brand" /> Fast • Fresh • Nearby
            </span>
            <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Crave it.
              <br />
              <span className="text-gradient">Get it delivered.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted">
              Mealmate brings the best food around you to your door — order in seconds,
              pay securely, and track your courier in real time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/browse" className="btn-primary px-6 py-3 text-base">
                <FiShoppingBag /> Browse restaurants
              </Link>
              <Link href="/help" className="btn-outline px-6 py-3 text-base">
                How it works <FiArrowRight />
              </Link>
            </div>

            <div className="mt-10 flex gap-8">
              {STATS.map((s) => (
                <div key={s.label}>
                  <div className="font-display text-2xl font-bold text-fg">{s.value}</div>
                  <div className="text-xs text-muted">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-fade-in">
            <CardRing images={RING_IMAGES} />
          </div>
        </div>
      </section>

      <LandingDiscovery />

      {/* Featured */}
      <section className="container py-16">
        <Reveal className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title">Top picks near you</h2>
            <p className="mt-1 text-muted">Ranked by what actually matters — taste, speed and price.</p>
          </div>
          <Link href="/browse" className="btn-ghost shrink-0">
            See all <FiArrowRight />
          </Link>
        </Reveal>
        <FeaturedRestaurants />
      </section>

      {/* How it works */}
      <section className="container py-16">
        <Reveal>
          <h2 className="section-title text-center">How Mealmate works</h2>
          <p className="mx-auto mt-2 max-w-md text-center text-muted">
            Three taps from hungry to happy.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 120}>
              <div className="card h-full transition-all hover:-translate-y-1 hover:border-brand/60">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand">
                  <step.icon size={22} />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Partner band */}
      <section className="container py-16">
        <Reveal>
          <div className="glass relative overflow-hidden p-8 text-center sm:p-12">
            <div className="pointer-events-none absolute inset-0 bg-radial-brand opacity-60" />
            <div className="relative">
              <h2 className="section-title">Grow with Mealmate</h2>
              <p className="mx-auto mt-3 max-w-lg text-muted">
                Run a restaurant or ride for a living? Join the marketplace and reach
                hungry customers near you.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link href="/register" className="btn-primary px-6 py-3">
                  Become a vendor
                </Link>
                <Link href="/register" className="btn-outline px-6 py-3">
                  Deliver with us
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Floating action button */}
      <Link
        href="/browse"
        aria-label="Start an order"
        className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-brand text-black shadow-glow animate-pulse-glow transition-transform hover:scale-110"
      >
        <FiShoppingBag size={22} />
      </Link>
    </div>
  );
};

export default Landing;
