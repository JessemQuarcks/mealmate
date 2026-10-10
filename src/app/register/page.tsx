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
    <div className="max-w-md mx-auto my-12 p-6 border rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold mb-6 text-center">Create your account</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
          <input id="name" required value={name} onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg p-2" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg p-2" />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
          <input id="password" type="password" required minLength={8} value={password}
            onChange={(e) => setPassword(e.target.value)} className="w-full border rounded-lg p-2" />
          <p className="text-xs text-gray-500 mt-1">At least 8 characters.</p>
        </div>

        <fieldset>
          <legend className="block text-sm font-medium mb-2">I am signing up as</legend>
          <div className="space-y-2">
            {ROLE_OPTIONS.map((opt) => (
              <label key={opt.value}
                className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer ${role === opt.value ? "border-blue-600 bg-blue-50" : ""}`}>
                <input type="radio" name="role" value={opt.value} checked={role === opt.value}
                  onChange={() => setRole(opt.value)} className="mt-1" />
                <span>
                  <span className="font-medium block">{opt.label}</span>
                  <span className="text-sm text-gray-500">{opt.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {notice && <p className="text-green-700 text-sm">{notice}</p>}

        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white rounded-lg py-2 disabled:opacity-60">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-sm text-center mt-6">
        Already have an account?{" "}
        <Link href="/signin" className="text-blue-600 underline">Sign in</Link>
      </p>
    </div>
  );
}
