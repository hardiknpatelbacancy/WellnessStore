import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[220px_1fr]">
      <aside className="space-y-2 rounded-lg border p-4">
        <p className="text-sm font-semibold">Admin Panel</p>
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/categories">Categories</Link>
          <Link href="/admin/products">Products</Link>
          <Link href="/admin/orders">Orders</Link>
          <Link href="/admin/messages">Messages</Link>
          <Link href="/admin/users">Admin Users</Link>
        </nav>
      </aside>
      <section>{children}</section>
    </div>
  );
}
