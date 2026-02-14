"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { CartItem, Category, Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addToCart, getCart } from "@/utils/cart";

export function ShopClient({
  categories,
  products
}: {
  categories: Category[];
  products: Product[];
}) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    setCart(getCart());
  }, []);

  const filtered = useMemo(() => {
    if (activeCategory === "all") return products;
    return products.filter((p) => p.category_id === activeCategory);
  }, [activeCategory, products]);

  const total = useMemo(
    () => cart.reduce((acc, i) => acc + Number(i.price) * i.quantity, 0),
    [cart]
  );

  function add(product: Product) {
    const next = addToCart({
      product_id: product.id,
      name: product.name,
      price: Number(product.price),
      image_url: product.image_url ?? null
    });
    setCart(next);
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
                  <Button size="sm" onClick={() => add(product)}>
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
            <div key={item.product_id} className="flex items-center justify-between text-sm">
              <span>
                {item.name} x {item.quantity}
              </span>
              <span>${(Number(item.price) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t pt-2 text-sm font-semibold">Total: ${total.toFixed(2)}</div>
          <Button className="w-full" onClick={() => router.push("/shop/basket")}>
            Go To Basket / Checkout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
