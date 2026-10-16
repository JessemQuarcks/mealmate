import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import SignOutButton from "@/components/SignOutButton";
import { FiSettings, FiClock, FiArrowRight } from "react-icons/fi";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin?callbackUrl=/account");

  const roleHomes: Record<string, string> = {
    vendor: "/vendor/dashboard",
    admin: "/admin",
    courier: "/courier/dashboard",
  };
  const roleHome = roleHomes[user.role];
  const initial = (user.name || user.email || "?").charAt(0).toUpperCase();

  return (
    <div className="container my-10 max-w-2xl">
      <div className="card flex items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand text-2xl font-bold text-black">
          {initial}
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold">{user.name || "Your account"}</h1>
          <p className="text-muted">{user.email}</p>
          <div className="mt-2 flex gap-2">
            <span className="badge bg-brand-soft text-brand capitalize">{user.role}</span>
            <span className="badge bg-surface-2 text-muted capitalize">{user.status}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Link href="/account/settings" className="card group transition-all hover:border-brand/60">
          <div className="flex items-center justify-between">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-surface-2 text-brand">
              <FiSettings size={20} />
            </div>
            <FiArrowRight className="text-muted transition-transform group-hover:translate-x-1" />
          </div>
          <h2 className="mt-3 font-semibold">Profile settings</h2>
          <p className="text-sm text-muted">Name, phone and delivery addresses.</p>
        </Link>

        <Link href="/history" className="card group transition-all hover:border-brand/60">
          <div className="flex items-center justify-between">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-surface-2 text-brand">
              <FiClock size={20} />
            </div>
            <FiArrowRight className="text-muted transition-transform group-hover:translate-x-1" />
          </div>
          <h2 className="mt-3 font-semibold">Your orders</h2>
          <p className="text-sm text-muted">Track active orders and view history.</p>
        </Link>
      </div>

      {roleHome && (
        <Link href={roleHome} className="btn-outline mt-5 inline-flex capitalize">
          Go to your {user.role} area <FiArrowRight />
        </Link>
      )}

      <div className="mt-8">
        <SignOutButton />
      </div>
    </div>
  );
}
