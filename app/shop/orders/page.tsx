import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function MyOrdersPage() {
  const profile = await requireAuth();
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("id,status,total_amount,created_at,order_items(quantity,price,products(name))")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-10">
      <h1 className="text-3xl font-bold">My Orders</h1>
      {(orders ?? []).map((order) => (
        <Card key={order.id}>
          <CardHeader>
            <CardTitle className="text-base">
              Order #{order.id.slice(0, 8)} - {order.status}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Date: {new Date(order.created_at).toLocaleString()}</p>
            <p>Total: ${Number(order.total_amount).toFixed(2)}</p>
            <ul className="space-y-1">
              {(order.order_items ?? []).map((item, idx) => (
                <li key={idx}>
                  {item.products?.name} x {item.quantity} = $
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
