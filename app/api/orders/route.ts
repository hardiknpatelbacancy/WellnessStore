import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

type Item = {
  product_id: string;
  quantity: number;
  price: number;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { items: Item[] };
  if (!body.items?.length) {
    return NextResponse.json({ error: "No items" }, { status: 400 });
  }

  const totalAmount = body.items.reduce((acc, i) => acc + Number(i.price) * i.quantity, 0);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({ user_id: user.id, total_amount: totalAmount, status: "pending" })
    .select("id")
    .single();
  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 400 });

  const payload = body.items.map((i) => ({
    order_id: order.id,
    product_id: i.product_id,
    quantity: i.quantity,
    price: i.price
  }));
  const { error: itemError } = await supabase.from("order_items").insert(payload);
  if (itemError) return NextResponse.json({ error: itemError.message }, { status: 400 });

  return NextResponse.json({ ok: true, order_id: order.id });
}
