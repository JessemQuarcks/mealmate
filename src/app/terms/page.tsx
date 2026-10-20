import React from "react";

export const metadata = {
  title: "Terms of Service — Mealmate",
  description: "The terms that govern use of Mealmate.",
};

export default function TermsPage() {
  return (
    <div className="container my-12 max-w-2xl">
      <h1 className="section-title mb-2">Terms of Service</h1>
      <p className="mb-6 text-sm text-muted">Last updated: {new Date().getFullYear()}</p>

      <div className="mb-8 rounded-xl border border-brand/40 bg-brand-soft/30 p-4 text-sm text-brand">
        Template only — review and finalise with legal counsel before launch.
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="mb-1 font-semibold text-fg">1. Using Mealmate</h2>
          <p>
            Mealmate connects customers with nearby restaurants and couriers. By creating an account
            you agree to provide accurate information and to use the service lawfully.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold text-fg">2. Orders &amp; payments</h2>
          <p>
            Prices are set by restaurants and confirmed at checkout. Payments are processed by
            Paystack; Mealmate charges a platform service fee shown in your order breakdown. Refunds
            and cancellations follow the policy in the app and the restaurant&apos;s terms.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold text-fg">3. Vendors &amp; couriers</h2>
          <p>
            Vendors and couriers are independent and must be verified before operating. They are
            responsible for the quality, safety and timeliness of what they provide.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold text-fg">4. Acceptable use</h2>
          <p>
            Don&apos;t misuse the service, attempt to defraud, or interfere with its operation.
            Accounts that violate these terms may be suspended.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold text-fg">5. Data sources</h2>
          <p>
            Restaurant listings may be sourced from third-party providers (e.g. Google Places) and
            are used under those providers&apos; terms. See our{" "}
            <a href="/privacy" className="text-brand underline">Privacy Policy</a>.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold text-fg">6. Changes</h2>
          <p>We may update these terms; continued use means you accept the updated terms.</p>
        </section>
      </div>
    </div>
  );
}
