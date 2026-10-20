import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { chave, template } = await req.json();
  if (!chave?.trim() || !template?.trim()) {
    return NextResponse.json({ error: "chave e template são obrigatórios." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("mensagens_config").upsert({ chave, template });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
