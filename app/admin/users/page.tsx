import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

async function createAdminUser(formData: FormData) {
  "use server";
  await requireAdmin();

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "");

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "admin" }
  });
  if (error) {
    throw new Error(error.message);
  }

  // Ensure profile exists and role is correct (trigger should handle it, but keep it deterministic).
  const supabase = await createClient();
  await supabase.from("profiles").upsert({
    id: data.user.id,
    full_name: fullName,
    role: "admin"
  });

  revalidatePath("/admin/users");
}

export default async function AdminUsersPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: admins } = await supabase
    .from("profiles")
    .select("id,full_name,role,created_at")
    .eq("role", "admin")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Users</h1>

      <Card>
        <CardHeader>
          <CardTitle>Create Admin User</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createAdminUser} className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1 md:col-span-1">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" name="full_name" placeholder="Jane Admin" required />
            </div>
            <div className="space-y-1 md:col-span-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="admin@example.com" required />
            </div>
            <div className="space-y-1 md:col-span-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" minLength={6} required />
            </div>
            <div className="md:col-span-3">
              <Button type="submit">Create Admin</Button>
            </div>
            <p className="md:col-span-3 text-sm text-muted-foreground">
              This uses the Supabase service role key on the server only. The created user is auto
              confirmed and gets `profiles.role = admin`.
            </p>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Admins</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(admins ?? []).map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="font-medium">{a.full_name ?? "Admin"}</div>
                <div className="text-muted-foreground">id: {a.id}</div>
              </div>
              <div className="text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
            </div>
          ))}
          {!admins?.length && <p className="text-muted-foreground">No admin users found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
