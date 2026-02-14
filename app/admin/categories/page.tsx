import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

async function createCategory(formData: FormData) {
  "use server";
  const supabase = await createClient();
  await supabase.from("categories").insert({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? "")
  });
  revalidatePath("/admin/categories");
}

async function updateCategory(formData: FormData) {
  "use server";
  const supabase = await createClient();
  await supabase
    .from("categories")
    .update({
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? "")
    })
    .eq("id", String(formData.get("id")));
  revalidatePath("/admin/categories");
}

async function deleteCategory(formData: FormData) {
  "use server";
  const supabase = await createClient();
  await supabase.from("categories").delete().eq("id", String(formData.get("id")));
  revalidatePath("/admin/categories");
}

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("*").order("created_at");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Categories</h1>

      <form action={createCategory} className="grid gap-2 rounded-lg border p-4 md:grid-cols-3">
        <Input name="name" placeholder="Category name" required />
        <Textarea name="description" placeholder="Description" />
        <Button type="submit">Create</Button>
      </form>

      <div className="space-y-3">
        {(categories ?? []).map((category) => (
          <form key={category.id} action={updateCategory} className="grid gap-2 rounded-lg border p-4">
            <input type="hidden" name="id" value={category.id} />
            <Input name="name" defaultValue={category.name} required />
            <Textarea name="description" defaultValue={category.description ?? ""} />
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                Update
              </Button>
              <Button formAction={deleteCategory} variant="destructive" size="sm">
                Delete
              </Button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
