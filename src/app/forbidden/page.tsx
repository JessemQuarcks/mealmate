import Link from "next/link";
import { FiLock } from "react-icons/fi";

export default function ForbiddenPage() {
  return (
    <div className="container my-24 flex flex-col items-center text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-surface-2 text-brand">
        <FiLock size={26} />
      </div>
      <h1 className="section-title mt-5">Access denied</h1>
      <p className="mt-2 max-w-sm text-muted">
        Your account doesn&apos;t have permission to view this page.
      </p>
      <Link href="/home" className="btn-primary mt-6">
        Back to home
      </Link>
    </div>
  );
}
