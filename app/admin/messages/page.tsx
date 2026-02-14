import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";

async function deleteMessage(formData: FormData) {
  "use server";
  const supabase = await createClient();
  await supabase.from("contact_messages").delete().eq("id", String(formData.get("id")));
  revalidatePath("/admin/messages");
}

export default async function AdminMessagesPage() {
  const supabase = await createClient();
  const { data: messages } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Contact Messages</h1>
      {(messages ?? []).map((m) => (
        <form key={m.id} className="rounded-lg border p-4" action={deleteMessage}>
          <input type="hidden" name="id" value={m.id} />
          <p className="font-semibold">
            {m.name} ({m.email})
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{m.message}</p>
          <div className="mt-3">
            <Button size="sm" variant="destructive">
              Delete
            </Button>
          </div>
        </form>
      ))}
      {!messages?.length && <p className="text-muted-foreground">No messages yet.</p>}
    </div>
  );
}
