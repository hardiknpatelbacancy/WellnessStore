import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

async function createProduct(formData: FormData) {
  "use server";
  const supabase = await createClient();
  await supabase.from("products").insert({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    price: Number(formData.get("price")),
    image_url: String(formData.get("image_url") ?? ""),
    category_id: String(formData.get("category_id") ?? "")
  });
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/shop");
}

async function updateProduct(formData: FormData) {
  "use server";
  const supabase = await createClient();
  await supabase
    .from("products")
    .update({
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      price: Number(formData.get("price")),
      image_url: String(formData.get("image_url") ?? ""),
      category_id: String(formData.get("category_id") ?? "")
    })
    .eq("id", String(formData.get("id")));
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/shop");
}

async function deleteProduct(formData: FormData) {
  "use server";
  const supabase = await createClient();
  await supabase.from("products").delete().eq("id", String(formData.get("id")));
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/shop");
}

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("id,name"),
    supabase.from("products").select("*").order("created_at", { ascending: false })
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Products</h1>

      <form action={createProduct} className="grid gap-2 rounded-lg border p-4 md:grid-cols-2">
        <Input name="name" placeholder="Name" required />
        <Input name="price" type="number" step="0.01" placeholder="Price" required />
        <Input name="image_url" placeholder="Image URL" />
        <select
          name="category_id"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select category</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Textarea name="description" placeholder="Description" className="md:col-span-2" />
        <Button type="submit" className="md:col-span-2">
          Create Product
        </Button>
      </form>

      <div className="space-y-3">
        {(products ?? []).map((product) => (
          <form key={product.id} action={updateProduct} className="grid gap-2 rounded-lg border p-4">
            <input type="hidden" name="id" value={product.id} />
            <div className="grid gap-2 md:grid-cols-2">
              <Input name="name" defaultValue={product.name} required />
              <Input name="price" type="number" step="0.01" defaultValue={product.price} required />
              <Input name="image_url" defaultValue={product.image_url ?? ""} />
              <select
                name="category_id"
                defaultValue={product.category_id}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                required
              >
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <Textarea name="description" defaultValue={product.description ?? ""} />
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                Update
              </Button>
              <Button formAction={deleteProduct} variant="destructive" size="sm">
                Delete
              </Button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
