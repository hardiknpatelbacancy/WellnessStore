import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS = [
  "pending",
  "approved",
  "processing",
  "completed",
  "cancelled",
  "returned"
] as const;

async function updateOrderStatus(formData: FormData) {
  "use server";
  const supabase = await createClient();
  await supabase
    .from("orders")
    .update({ status: String(formData.get("status") ?? "pending") })
    .eq("id", String(formData.get("id")));
  revalidatePath("/admin/orders");
  revalidatePath("/shop/orders");
}

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id,status,total_amount,created_at,profiles(full_name),order_items(quantity,products(name))")
    .order("created_at", { ascending: false });

  // Supabase join shapes can be inferred as arrays depending on relationship metadata.
  const getProfileFullName = (profiles: unknown) =>
    Array.isArray(profiles) ? profiles[0]?.full_name : (profiles as any)?.full_name;
  const getProductName = (products: unknown) =>
    Array.isArray(products) ? products[0]?.name : (products as any)?.name;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Manage Orders</h1>
      {(orders ?? []).map((order) => (
        <form key={order.id} action={updateOrderStatus} className="rounded-lg border p-4">
          <input type="hidden" name="id" value={order.id} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold">#{order.id.slice(0, 8)}</p>
              <p className="text-sm text-muted-foreground">
                Customer: {getProfileFullName(order.profiles) ?? "Unknown"}
              </p>
              <p className="text-sm">Total: ${Number(order.total_amount).toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
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
            </div>
          </div>
          <ul className="mt-3 text-sm text-muted-foreground">
            {(order.order_items ?? []).map((item, idx) => (
              <li key={idx}>
                {getProductName(item.products) ?? "Product"} x {item.quantity}
              </li>
            ))}
          </ul>
        </form>
      ))}
    </div>
  );
}
