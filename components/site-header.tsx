import Link from "next/link";
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
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold">
          Wellness<span className="text-primary">Store</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/shop" className="px-3 py-2 text-sm">
            Shop
          </Link>
          <Link href="/contact" className="px-3 py-2 text-sm">
            Contact
          </Link>
          {isAdmin && (
            <details className="relative">
              <summary className="cursor-pointer list-none rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
                Admin
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
              <Button size="sm">Sign in</Button>
            </Link>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
