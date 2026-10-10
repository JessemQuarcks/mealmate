import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="max-w-md mx-auto my-20 text-center px-4">
      <h1 className="text-3xl font-bold mb-3">Access denied</h1>
      <p className="text-gray-600 mb-6">
        Your account doesn&apos;t have permission to view this page.
      </p>
      <Link href="/home" className="text-blue-600 underline">
        Back to home
      </Link>
    </div>
  );
}
