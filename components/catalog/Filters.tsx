"use client";

import { Category } from "@/types";

export function CategoryTabs({
  categories,
  current,
  onChange,
}: {
  categories: Category[];
  current: string;
  onChange: (key: string) => void;
}) {
  const all = [{ key: "todos", label: "Todos" }, ...categories];
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 px-4" style={{ scrollbarWidth: "none" }}>
      {all.map((c) => (
        <button
          key={c.key}
          onClick={() => onChange(c.key)}
          className={`chip ${current === c.key ? "active" : ""} rounded-full px-4 py-2 text-xs font-medium`}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

export function BrandChips({
  brands,
  current,
  onChange,
}: {
  brands: string[];
  current: string;
  onChange: (brand: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-3 pt-2 px-4" style={{ scrollbarWidth: "none" }}>
      <button
        onClick={() => onChange("todas")}
        className={`chip ${current === "todas" ? "active" : ""} rounded-full px-3.5 py-1.5 text-[11px] font-medium`}
      >
        Todas as marcas
      </button>
      {brands.map((b) => (
        <button
          key={b}
          onClick={() => onChange(b)}
          className={`chip ${current === b ? "active" : ""} rounded-full px-3.5 py-1.5 text-[11px] font-medium`}
        >
          {b}
        </button>
      ))}
    </div>
  );
}
