"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import type { Category, Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CartItem = Product & { quantity: number };

export function ShopClient({
  categories,
  products
}: {
  categories: Category[];
  products: Product[];
}) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const router = useRouter();

  const filtered = useMemo(() => {
    if (activeCategory === "all") return products;
    return products.filter((p) => p.category_id === activeCategory);
  }, [activeCategory, products]);

  const total = cart.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }

  async function placeOrder() {
    if (!cart.length) return;
    setPlacingOrder(true);
    const supabase = createClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (!session) {
      router.push("/auth");
      return;
    }

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((i) => ({
          product_id: i.id,
          quantity: i.quantity,
          price: i.price
        }))
      })
    });

    if (response.ok) {
      setCart([]);
      router.refresh();
      alert("Order created successfully.");
    } else {
      alert("Could not create order.");
    }
    setPlacingOrder(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeCategory === "all" ? "default" : "outline"}
            onClick={() => setActiveCategory("all")}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="relative h-40">
                <Image
                  src={product.image_url ?? "https://picsum.photos/600/400"}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-base">{product.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-muted-foreground">{product.description}</p>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">${Number(product.price).toFixed(2)}</p>
                  <Button size="sm" onClick={() => addToCart(product)}>
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Basket</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!cart.length && <p className="text-sm text-muted-foreground">No items yet.</p>}
          {cart.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span>
                {item.name} x {item.quantity}
              </span>
              <span>${(Number(item.price) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t pt-2 text-sm font-semibold">Total: ${total.toFixed(2)}</div>
          <Button className="w-full" disabled={!cart.length || placingOrder} onClick={placeOrder}>
            {placingOrder ? "Placing..." : "Place Order"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
