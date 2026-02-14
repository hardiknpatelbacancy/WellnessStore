"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, Minus, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import type { Address, CartItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { clearCart, getCart, removeFromCart, setCart, updateQuantity } from "@/utils/cart";

type AddressForm = {
  label: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
};

export default function BasketPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  const total = useMemo(
    () => items.reduce((acc, i) => acc + Number(i.price) * i.quantity, 0),
    [items]
  );

  async function refreshPrices(cart: CartItem[]) {
    if (!cart.length) return cart;
    const supabase = createClient();
    const ids = cart.map((c) => c.product_id);
    const { data: products } = await supabase
      .from("products")
      .select("id,name,price,image_url")
      .in("id", ids);

    const byId = new Map((products ?? []).map((p) => [p.id, p]));
    const next = cart.map((c) => {
      const p = byId.get(c.product_id);
      if (!p) return c;
      return {
        ...c,
        name: p.name,
        price: Number(p.price),
        image_url: p.image_url ?? null
      };
    });
    setCart(next);
    return next;
  }

  async function loadAddresses() {
    const supabase = createClient();
    const { data: list } = await supabase
      .from("addresses")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    const next = (list ?? []) as Address[];
    setAddresses(next);
    const def = next.find((a) => a.is_default);
    if (def) setSelectedAddressId(def.id);
    else if (next[0]) setSelectedAddressId(next[0].id);
  }

  useEffect(() => {
    (async () => {
      const cart = getCart();
      const priced = await refreshPrices(cart);
      setItems(priced);
      await loadAddresses();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setQty(product_id: string, quantity: number) {
    const next = updateQuantity(product_id, quantity);
    setItems(next);
  }

  function inc(product_id: string) {
    const cur = items.find((i) => i.product_id === product_id)?.quantity ?? 1;
    setQty(product_id, cur + 1);
  }

  function dec(product_id: string) {
    const cur = items.find((i) => i.product_id === product_id)?.quantity ?? 1;
    setQty(product_id, Math.max(1, cur - 1));
  }

  function remove(product_id: string) {
    const next = removeFromCart(product_id);
    setItems(next);
  }

  async function addAddress(form: AddressForm) {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Please sign in to save an address.");

    // If making default, unset others first (RLS allows only own rows).
    if (form.is_default) {
      await supabase.from("addresses").update({ is_default: false }).eq("is_default", true);
    }

    const { error } = await supabase.from("addresses").insert({
      user_id: user.id,
      label: form.label || null,
      line1: form.line1,
      line2: form.line2 || null,
      city: form.city,
      state: form.state,
      postal_code: form.postal_code,
      country: form.country,
      is_default: form.is_default
    });
    if (error) throw new Error(error.message);
    await loadAddresses();
    setMsg("Address saved.");
  }

  async function setDefaultAddress(id: string) {
    const supabase = createClient();
    await supabase.from("addresses").update({ is_default: false }).eq("is_default", true);
    const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    if (error) throw new Error(error.message);
    await loadAddresses();
    setMsg("Default address updated.");
  }

  async function deleteAddress(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await loadAddresses();
    setMsg("Address deleted.");
  }

  async function placeOrder() {
    setLoading(true);
    setMsg(null);
    try {
      const supabase = createClient();
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }
      if (!items.length) {
        setMsg("Basket is empty.");
        return;
      }
      if (!selectedAddressId) {
        setMsg("Select an address before placing the order.");
        return;
      }

      const address = addresses.find((a) => a.id === selectedAddressId) ?? null;
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address_id: selectedAddressId,
          shipping_address: address
            ? {
                label: address.label,
                line1: address.line1,
                line2: address.line2,
                city: address.city,
                state: address.state,
                postal_code: address.postal_code,
                country: address.country
              }
            : null,
          items: items.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
            price: i.price
          }))
        })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? "Could not create order.");
      }

      clearCart();
      setItems([]);
      router.push("/shop/orders");
      router.refresh();
    } catch (e: any) {
      setMsg(e?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Basket / Checkout</h1>
        <Button variant="outline" onClick={() => router.push("/shop")}>
          Continue Shopping
        </Button>
      </div>

      {msg && <p className="text-sm">{msg}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!items.length && <p className="text-sm text-muted-foreground">Your basket is empty.</p>}
            {items.map((i) => (
              <div key={i.product_id} className="flex gap-3 rounded-lg border p-3">
                <div className="relative h-16 w-20 overflow-hidden rounded-md">
                  <Image
                    src={i.image_url ?? "https://picsum.photos/600/400"}
                    alt={i.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">{i.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ${Number(i.price).toFixed(2)} each
                      </div>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => remove(i.product_id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`qty_${i.product_id}`}>Qty</Label>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => dec(i.product_id)}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          id={`qty_${i.product_id}`}
                          type="number"
                          min={1}
                          value={i.quantity}
                          onChange={(e) => setQty(i.product_id, Number(e.target.value))}
                          className="w-20 text-center"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => inc(i.product_id)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="font-semibold">
                      ${(Number(i.price) * i.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3">
                <Button className="w-full" disabled={loading || !items.length} onClick={placeOrder}>
                  {loading ? "Placing..." : "Place Order"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Payment is not included; this creates an order record only.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!addresses.length && (
                <p className="text-sm text-muted-foreground">Add an address below.</p>
              )}
              {addresses.map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                  <label className="flex flex-1 cursor-pointer gap-2">
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressId === a.id}
                      onChange={() => setSelectedAddressId(a.id)}
                    />
                    <div className="text-sm">
                      <div className="font-semibold">
                        {a.label ?? "Address"} {a.is_default ? "(Default)" : ""}
                      </div>
                      <div className="text-muted-foreground">
                        {a.line1}
                        {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.postal_code},{" "}
                        {a.country}
                      </div>
                    </div>
                  </label>
                  <div className="flex flex-col gap-2">
                    {!a.is_default && (
                      <Button size="sm" variant="outline" onClick={() => setDefaultAddress(a.id)}>
                        Make Default
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => deleteAddress(a.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}

              <div className="rounded-lg border p-3">
                <p className="mb-3 text-sm font-semibold">Add New Address</p>
                <form
                  className="grid gap-3"
                  action={async (formData) => {
                    setMsg(null);
                    try {
                      await addAddress({
                        label: String(formData.get("label") ?? ""),
                        line1: String(formData.get("line1") ?? ""),
                        line2: String(formData.get("line2") ?? ""),
                        city: String(formData.get("city") ?? ""),
                        state: String(formData.get("state") ?? ""),
                        postal_code: String(formData.get("postal_code") ?? ""),
                        country: String(formData.get("country") ?? ""),
                        is_default: Boolean(formData.get("is_default"))
                      });
                    } catch (e: any) {
                      setMsg(e?.message ?? "Could not save address.");
                    }
                  }}
                >
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="label">Label</Label>
                      <Input id="label" name="label" placeholder="Home / Office" />
                    </div>
                    <div className="flex items-end gap-2">
                      <input id="is_default" name="is_default" type="checkbox" />
                      <Label htmlFor="is_default">Set as default</Label>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="line1">Address line 1</Label>
                    <Input id="line1" name="line1" required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="line2">Address line 2</Label>
                    <Textarea id="line2" name="line2" rows={2} />
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" name="city" required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="state">State</Label>
                      <Input id="state" name="state" required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="postal_code">Postal code</Label>
                      <Input id="postal_code" name="postal_code" required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="country">Country</Label>
                      <Input id="country" name="country" required defaultValue="India" />
                    </div>
                  </div>
                  <Button type="submit">Save Address</Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
