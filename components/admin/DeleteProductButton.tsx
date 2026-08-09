"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteProductButton({ id, nome }: { id: string; nome: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Excluir "${nome}" permanentemente?`)) return;
    setLoading(true);
    const res = await fetch("/api/admin/produtos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert("Erro ao excluir: " + (data.error || "tente novamente"));
      return;
    }
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-full px-3 py-1.5 text-xs"
      style={{ background: "rgba(176,85,75,0.1)", color: "#B0554B" }}
    >
      {loading ? "..." : "Excluir"}
    </button>
  );
}
