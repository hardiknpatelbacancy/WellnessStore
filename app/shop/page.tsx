import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { ShopClient } from "@/components/shop-client";
import { Button } from "@/components/ui/button";
import type { Category, Product } from "@/lib/types";

export default async function ShopPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("products").select("*").order("created_at", { ascending: false })
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Shop Wellness Products</h1>
        <Link href="/shop/orders">
          <Button variant="outline">My Orders</Button>
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">
        Add items to your basket, then checkout from the basket page.
      </p>
      <ShopClient
        categories={(categories ?? []) as Category[]}
        products={(products ?? []) as Product[]}
      />
    </div>
  );
}
