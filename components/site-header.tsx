import Link from "next/link";
import { LayoutDashboard, Mail, Menu, ShoppingBag, User } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  const isAdmin = profile?.role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="group flex items-center gap-2 text-xl font-black tracking-tight">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <span>
            Wellness<span className="text-primary">Store</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 md:flex">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
          >
            <ShoppingBag className="h-4 w-4" />
            Shop
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
          >
            <Mail className="h-4 w-4" />
            Contact
          </Link>
          {isAdmin && (
            <details className="relative">
              <summary className="cursor-pointer list-none rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
                <span className="inline-flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Admin
                </span>
              </summary>
              <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-background p-2 shadow-lg">
                <Link className="block rounded-md px-3 py-2 text-sm hover:bg-accent" href="/admin">
                  Dashboard
                </Link>
                <Link
                  className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
                  href="/admin/categories"
                >
                  Categories
                </Link>
                <Link
                  className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
                  href="/admin/products"
                >
                  Products
                </Link>
                <Link
                  className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
                  href="/admin/orders"
                >
                  Orders
                </Link>
                <Link
                  className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
                  href="/admin/messages"
                >
                  Messages
                </Link>
                <Link
                  className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
                  href="/admin/users"
                >
                  Admin Users
                </Link>
              </div>
            </details>
          )}
          {user ? (
            <form action="/auth/signout" method="post">
              <Button variant="outline" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          ) : (
            <Link href="/auth">
              <Button size="sm">
                <User className="mr-2 h-4 w-4" />
                Sign in
              </Button>
            </Link>
          )}
          <ThemeToggle />
        </nav>

        {/* Mobile nav */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <details className="relative">
            <summary className="list-none">
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </summary>
            <div className="absolute right-0 mt-2 w-64 rounded-xl border bg-background p-2 shadow-lg">
              <Link
                href="/shop"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
              >
                <ShoppingBag className="h-4 w-4" />
                Shop
              </Link>
              <Link
                href="/contact"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
              >
                <Mail className="h-4 w-4" />
                Contact
              </Link>
              {isAdmin && (
                <>
                  <div className="my-2 border-t" />
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Admin Dashboard
                  </Link>
                  <Link href="/admin/categories" className="rounded-lg px-3 py-2 text-sm hover:bg-accent block">
                    Categories
                  </Link>
                  <Link href="/admin/products" className="rounded-lg px-3 py-2 text-sm hover:bg-accent block">
                    Products
                  </Link>
                  <Link href="/admin/orders" className="rounded-lg px-3 py-2 text-sm hover:bg-accent block">
                    Orders
                  </Link>
                  <Link href="/admin/messages" className="rounded-lg px-3 py-2 text-sm hover:bg-accent block">
                    Messages
                  </Link>
                  <Link href="/admin/users" className="rounded-lg px-3 py-2 text-sm hover:bg-accent block">
                    Admin Users
                  </Link>
                </>
              )}
              <div className="my-2 border-t" />
              {user ? (
                <form action="/auth/signout" method="post">
                  <Button variant="outline" className="w-full" type="submit">
                    Sign out
                  </Button>
                </form>
              ) : (
                <Link href="/auth">
                  <Button className="w-full">
                    <User className="mr-2 h-4 w-4" />
                    Sign in
                  </Button>
                </Link>
              )}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
