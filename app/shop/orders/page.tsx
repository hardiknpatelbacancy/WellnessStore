import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

const STATUS_OPTIONS = [
  "pending",
  "approved",
  "processing",
  "completed",
  "cancelled",
  "returned"
] as const;

const getProductName = (products: unknown) =>
  Array.isArray(products) ? products[0]?.name : (products as any)?.name;

async function adminUpdateOrderStatus(formData: FormData) {
  "use server";
  await requireAdmin();
  const supabase = await createClient();
  await supabase
    .from("orders")
    .update({ status: String(formData.get("status") ?? "pending") })
    .eq("id", String(formData.get("id")));
  revalidatePath("/shop/orders");
  revalidatePath("/admin/orders");
}

export default async function MyOrdersPage() {
  const profile = await requireAuth();
  const supabase = await createClient();

  const isAdmin = profile.role === "admin";

  const { data: orders } = isAdmin
    ? await supabase
        .from("orders")
        .select(
          "id,status,total_amount,created_at,profiles(full_name),order_items(quantity,price,products(name))"
        )
        .order("created_at", { ascending: false })
    : await supabase
        .from("orders")
        .select("id,status,total_amount,created_at,order_items(quantity,price,products(name))")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-10">
      <h1 className="text-3xl font-bold">{isAdmin ? "All Orders" : "My Orders"}</h1>
      {(orders ?? []).map((order) => (
        <Card key={order.id}>
          <CardHeader>
            <CardTitle className="text-base">Order #{order.id.slice(0, 8)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <p>Date: {new Date(order.created_at).toLocaleString()}</p>
                <p>Total: ${Number(order.total_amount).toFixed(2)}</p>
                <p>
                  Status: <span className="font-semibold">{order.status}</span>
                </p>
                {"profiles" in (order as any) && (
                  <p className="text-muted-foreground">
                    Customer: {(order as any).profiles?.[0]?.full_name ?? (order as any).profiles?.full_name ?? "Unknown"}
                  </p>
                )}
              </div>
              {isAdmin && (
                <form action={adminUpdateOrderStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={order.id} />
                  <select
                    name="status"
                    defaultValue={order.status}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" size="sm">
                    Save
                  </Button>
                </form>
              )}
            </div>
            <ul className="space-y-1">
              {(order.order_items ?? []).map((item: any, idx: number) => (
                <li key={idx}>
                  {getProductName(item.products) ?? "Product"} x {item.quantity} = $
                  {(Number(item.price) * item.quantity).toFixed(2)}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
      {!orders?.length && <p className="text-muted-foreground">No orders yet.</p>}
    </div>
  );
}
