"use client";

import type { CartItem } from "@/lib/types";

const KEY = "wellness_cart_v1";

function safeParse(json: string | null): CartItem[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x) => x && typeof x === "object")
      .map((x: any) => ({
        product_id: String(x.product_id),
        name: String(x.name ?? ""),
        price: Number(x.price ?? 0),
        image_url: x.image_url ? String(x.image_url) : null,
        quantity: Math.max(1, Number(x.quantity ?? 1))
      }));
  } catch {
    return [];
  }
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(KEY));
}

export function setCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function addToCart(item: Omit<CartItem, "quantity">) {
  const cart = getCart();
  const existing = cart.find((c) => c.product_id === item.product_id);
  const next = existing
    ? cart.map((c) =>
        c.product_id === item.product_id ? { ...c, quantity: c.quantity + 1 } : c
      )
    : [...cart, { ...item, quantity: 1 }];
  setCart(next);
  return next;
}

export function updateQuantity(product_id: string, quantity: number) {
  const cart = getCart();
  const q = Math.max(1, quantity);
  const next = cart.map((c) => (c.product_id === product_id ? { ...c, quantity: q } : c));
  setCart(next);
  return next;
}

export function removeFromCart(product_id: string) {
  const cart = getCart();
  const next = cart.filter((c) => c.product_id !== product_id);
  setCart(next);
  return next;
}

export function clearCart() {
  setCart([]);
}

