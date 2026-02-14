import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: featured } = await supabase
    .from("products")
    .select("id,name,description,price,image_url")
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <div className="hero-gradient min-h-[calc(100vh-64px)]">
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-2 md:items-center">
        <div className="space-y-6">
          <p className="inline-block rounded-full bg-primary/15 px-3 py-1 text-sm font-medium text-primary">
            Daily wellness, simplified
          </p>
          <h1 className="text-4xl font-black leading-tight md:text-6xl">
            Feel Better With Curated Wellness Products
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Herbal supplements, organic skincare, and fitness essentials from one clean, modern
            store.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/shop">
              <Button size="lg">Start Shopping</Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="secondary">
                Talk to Us
              </Button>
            </Link>
          </div>
        </div>
        <Card className="border-none bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle>Why customers choose WellnessStore</CardTitle>
            <CardDescription>Simple ingredients. Clear pricing. Fast ordering.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-lg bg-primary/10 p-4">Trusted wellness brands</div>
            <div className="rounded-lg bg-secondary/20 p-4">Category-first shopping experience</div>
            <div className="rounded-lg bg-accent/20 p-4">Secure auth and order history</div>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="mb-6 text-2xl font-bold">Featured Products</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {(featured ?? []).map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="relative h-44 w-full">
                <Image
                  src={product.image_url ?? "https://picsum.photos/600/400"}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription>{product.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <p className="text-lg font-bold">${Number(product.price).toFixed(2)}</p>
                <Link href="/shop">
                  <Button size="sm">View</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
