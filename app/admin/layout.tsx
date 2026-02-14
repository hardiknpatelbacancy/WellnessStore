import Link from "next/link";
import { LayoutDashboard, ListOrdered, Mail, Package, Tags, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[220px_1fr]">
      <aside className="space-y-3 rounded-xl border bg-card/60 p-4 backdrop-blur">
        <p className="text-sm font-semibold">Admin Panel</p>
        <nav className="flex flex-col gap-1 text-sm">
          <Link className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent" href="/admin">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent"
            href="/admin/categories"
          >
            <Tags className="h-4 w-4" />
            Categories
          </Link>
          <Link className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent" href="/admin/products">
            <Package className="h-4 w-4" />
            Products
          </Link>
          <Link className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent" href="/admin/orders">
            <ListOrdered className="h-4 w-4" />
            Orders
          </Link>
          <Link className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent" href="/admin/messages">
            <Mail className="h-4 w-4" />
            Messages
          </Link>
          <Link className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent" href="/admin/users">
            <Users className="h-4 w-4" />
            Admin Users
          </Link>
        </nav>
      </aside>
      <section>{children}</section>
    </div>
  );
}
