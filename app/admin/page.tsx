import { createClient } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    { count: categories },
    { count: products },
    { count: messages },
    { data: ordersList },
    { data: recentOrders },
    { data: recentOrderItems }
  ] = await Promise.all([
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("contact_messages").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("id,status,total_amount,created_at"),
    supabase
      .from("orders")
      .select("id,status,total_amount,created_at,profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(5),
    // For a dashboard, a small window is usually enough.
    supabase
      .from("order_items")
      .select("product_id,quantity,price")
      .order("id", { ascending: false })
      .limit(300)
  ]);

  const orders = ordersList ?? [];
  const ordersCount = orders.length;
  const totalRevenue = orders.reduce((acc, o) => acc + Number((o as any).total_amount ?? 0), 0);
  const avgOrderValue = ordersCount ? totalRevenue / ordersCount : 0;

  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    const s = String((o as any).status ?? "unknown");
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const last7DaysBuckets = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sevenDaysAgo);
    d.setDate(sevenDaysAgo.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    return { key, label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), count: 0 };
  });
  const bucketIndex = new Map(last7DaysBuckets.map((b, idx) => [b.key, idx]));
  orders.forEach((o) => {
    const created = new Date(String((o as any).created_at ?? ""));
    if (Number.isNaN(created.valueOf())) return;
    if (created < sevenDaysAgo) return;
    const key = created.toISOString().slice(0, 10);
    const idx = bucketIndex.get(key);
    if (idx === undefined) return;
    last7DaysBuckets[idx]!.count += 1;
  });
  const maxBucket = Math.max(1, ...last7DaysBuckets.map((b) => b.count));

  // Top products by quantity (from recent items window)
  const items = recentOrderItems ?? [];
  const byProduct = items.reduce<Record<string, { qty: number; revenue: number }>>((acc, it) => {
    const pid = String((it as any).product_id ?? "");
    if (!pid) return acc;
    const qty = Number((it as any).quantity ?? 0);
    const price = Number((it as any).price ?? 0);
    const cur = acc[pid] ?? { qty: 0, revenue: 0 };
    cur.qty += qty;
    cur.revenue += qty * price;
    acc[pid] = cur;
    return acc;
  }, {});
  const topProductIds = Object.entries(byProduct)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5)
    .map(([id]) => id);
  const { data: topProducts } = topProductIds.length
    ? await supabase.from("products").select("id,name").in("id", topProductIds)
    : { data: [] as any[] };
  const topNameById = new Map((topProducts ?? []).map((p: any) => [p.id, p.name]));

  const cards = [
    { label: "Categories", value: categories ?? 0 },
    { label: "Products", value: products ?? 0 },
    { label: "Orders", value: ordersCount },
    { label: "Messages", value: messages ?? 0 }
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader>
              <CardTitle className="text-sm">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Orders (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 items-end gap-2">
              {last7DaysBuckets.map((b) => (
                <div key={b.key} className="flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-md bg-primary/60"
                    style={{ height: `${Math.round((b.count / maxBucket) * 120)}px` }}
                    title={`${b.count} orders`}
                  />
                  <div className="text-xs text-muted-foreground">{b.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">${totalRevenue.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Avg order</span>
              <span className="font-semibold">${avgOrderValue.toFixed(2)}</span>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">By status</p>
              {Object.entries(statusCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([s, n]) => (
                  <div key={s} className="flex items-center justify-between">
                    <span>{s}</span>
                    <span className="font-semibold">{n}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(recentOrders ?? []).map((o: any) => {
              const customer =
                (Array.isArray(o.profiles) ? o.profiles[0]?.full_name : o.profiles?.full_name) ??
                "Unknown";
              return (
                <div key={o.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <div className="font-medium">#{String(o.id).slice(0, 8)}</div>
                    <div className="text-muted-foreground">{customer}</div>
                    <div className="text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${Number(o.total_amount).toFixed(2)}</div>
                    <div className="text-muted-foreground">{o.status}</div>
                  </div>
                </div>
              );
            })}
            {!recentOrders?.length && <p className="text-muted-foreground">No orders yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Products (Recent)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {topProductIds.map((pid) => {
              const agg = byProduct[pid]!;
              return (
                <div key={pid} className="flex items-center justify-between rounded-md border p-3">
                  <div className="font-medium">{topNameById.get(pid) ?? pid.slice(0, 8)}</div>
                  <div className="text-right">
                    <div className="font-semibold">{agg.qty} sold</div>
                    <div className="text-muted-foreground">${agg.revenue.toFixed(2)}</div>
                  </div>
                </div>
              );
            })}
            {!topProductIds.length && <p className="text-muted-foreground">No order items yet.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
