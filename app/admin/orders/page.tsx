import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";

async function updateOrderStatus(formData: FormData) {
  "use server";
  const supabase = await createClient();
  await supabase
    .from("orders")
    .update({ status: String(formData.get("status") ?? "pending") })
    .eq("id", String(formData.get("id")));
  revalidatePath("/admin/orders");
}

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id,status,total_amount,created_at,profiles(full_name),order_items(quantity,products(name))")
    .order("created_at", { ascending: false });

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
                Customer: {order.profiles?.[0]?.full_name ?? "Unknown"}
              </p>
              <p className="text-sm">Total: ${Number(order.total_amount).toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                name="status"
                defaultValue={order.status}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="pending">pending</option>
                <option value="processing">processing</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </select>
              <Button type="submit" size="sm">
                Save
              </Button>
            </div>
          </div>
          <ul className="mt-3 text-sm text-muted-foreground">
            {(order.order_items ?? []).map((item, idx) => (
              <li key={idx}>
                {item.products?.name} x {item.quantity}
              </li>
            ))}
          </ul>
        </form>
      ))}
    </div>
  );
}
