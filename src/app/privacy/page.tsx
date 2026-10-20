import React from "react";

export const metadata = {
  title: "Privacy Policy — Mealmate",
  description: "How Mealmate collects, uses and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="container my-12 max-w-2xl">
      <h1 className="section-title mb-2">Privacy Policy</h1>
      <p className="mb-6 text-sm text-muted">Last updated: {new Date().getFullYear()}</p>

      <div className="mb-8 rounded-xl border border-brand/40 bg-brand-soft/30 p-4 text-sm text-brand">
        Template only — review and finalise with legal counsel before launch.
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="mb-1 font-semibold text-fg">What we collect</h2>
          <p>
            Account details (name, email, phone), delivery addresses, order history, and — only
            while you choose to share it — your device location to show nearby restaurants and to let
            you track a delivery.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold text-fg">How we use it</h2>
          <p>
            To take and deliver orders, process payments (via Paystack), surface relevant restaurants,
            provide support, and keep the service secure. We do not sell your personal data.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold text-fg">Location</h2>
          <p>
            Location is used on the discover and tracking screens only when you grant permission, and
            a courier&apos;s live location is shared with the customer during an active delivery.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold text-fg">Third parties</h2>
          <p>
            We rely on Paystack (payments), MongoDB (storage) and Google Maps/Places (maps and
            listings). Their handling of data is governed by their own policies.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold text-fg">Your choices</h2>
          <p>
            You can edit your profile and addresses in{" "}
            <a href="/account/settings" className="text-brand underline">account settings</a>, and
            request deletion of your account by contacting support.
          </p>
        </section>
      </div>
    </div>
  );
}
