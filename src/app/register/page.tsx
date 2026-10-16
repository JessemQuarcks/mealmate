"use client";
import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Role = "client" | "vendor" | "courier";

const ROLE_OPTIONS: { value: Role; label: string; hint: string }[] = [
  { value: "client", label: "Customer", hint: "Order food from nearby restaurants" },
  { value: "vendor", label: "Restaurant", hint: "List and manage your storefront (needs approval)" },
  { value: "courier", label: "Courier", hint: "Deliver orders (needs approval)" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("client");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.errors?.join(", ") || "Could not create account.");
        return;
      }

      if (role === "client") {
        // Active immediately — sign straight in.
        await signIn("credentials", { email, password, callbackUrl: "/home" });
      } else {
        setNotice(
          "Account created and pending approval. You can sign in, but access unlocks once an admin verifies you."
        );
        setTimeout(() => router.push("/signin"), 2500);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container my-16 flex justify-center">
      <div className="glass w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand text-xl font-bold text-black">
            M
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-muted">Join Mealmate in a few seconds.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm text-muted">Name</label>
            <input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="input" />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-muted">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-muted">Password</label>
            <input id="password" type="password" required minLength={8} value={password}
              onChange={(e) => setPassword(e.target.value)} className="input" />
            <p className="mt-1 text-xs text-muted">At least 8 characters.</p>
          </div>

          <fieldset>
            <legend className="mb-2 block text-sm text-muted">I am signing up as</legend>
            <div className="space-y-2">
              {ROLE_OPTIONS.map((opt) => (
                <label key={opt.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                    role === opt.value ? "border-brand bg-brand-soft/40" : "border-line hover:border-line"
                  }`}>
                  <input type="radio" name="role" value={opt.value} checked={role === opt.value}
                    onChange={() => setRole(opt.value)} className="mt-1 accent-[color:rgb(var(--brand))]" />
                  <span>
                    <span className="block font-medium">{opt.label}</span>
                    <span className="text-sm text-muted">{opt.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {notice && <p className="text-sm text-brand">{notice}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/signin" className="font-medium text-brand">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
