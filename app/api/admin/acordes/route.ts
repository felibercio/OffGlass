import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { key, label, cor } = await req.json();
  if (!key?.trim() || !label?.trim() || !cor?.trim()) {
    return NextResponse.json({ error: "key, label e cor são obrigatórios." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("acordes").upsert({ key, label, cor });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { key } = await req.json();
  const supabase = createAdminClient();
  const { error } = await supabase.from("acordes").delete().eq("key", key);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
