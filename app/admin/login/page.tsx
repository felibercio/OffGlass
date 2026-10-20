"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setLoading(false);
    if (error) {
      setError("E-mail ou senha incorretos.");
      return;
    }
    router.push("/admin/produtos");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="glass-strong rounded-2xl p-8 w-full max-w-sm">
        <p className="text-[10px] tracking-label uppercase text-center mb-1" style={{ color: "var(--gold-deep)" }}>
          Offglass Scent
        </p>
        <h1 className="font-display text-2xl text-center mb-6">Painel administrativo</h1>

        {error && <div className="text-xs text-center mb-3" style={{ color: "#B0554B" }}>{error}</div>}

        <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
          E-mail
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg px-3 py-2 mb-3 text-sm"
          placeholder="seu@email.com"
        />
        <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
          Senha
        </label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          className="w-full rounded-lg px-3 py-2 mb-5 text-sm"
          placeholder="••••••••"
        />
        <button
          onClick={handleLogin}
          disabled={loading}
          className="btn-teal w-full rounded-full py-2.5 text-sm font-medium"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
        <Link href="/" className="block text-center text-xs mt-4 underline" style={{ color: "var(--ink-soft)" }}>
          Voltar ao catálogo
        </Link>
      </div>
    </div>
  );
}
