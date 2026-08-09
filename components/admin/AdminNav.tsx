"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TABS = [
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/acordes", label: "Acordes" },
  { href: "/admin/mensagens", label: "Mensagens" },
  { href: "/admin/pedidos", label: "Pedidos" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") return null;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 glass-strong">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-[10px] tracking-label uppercase" style={{ color: "var(--gold-deep)" }}>
            Offglass Decants
          </p>
          <h1 className="font-display text-xl">Painel administrativo</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/" className="btn-glass rounded-full px-3 py-2 text-xs">
            Ver catálogo
          </Link>
          <button onClick={handleLogout} className="btn-glass rounded-full px-3 py-2 text-xs">
            Sair
          </button>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-3 px-4" style={{ scrollbarWidth: "none" }}>
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`chip ${pathname.startsWith(t.href) ? "active" : ""} rounded-full px-4 py-2 text-xs font-medium`}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
