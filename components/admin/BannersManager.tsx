"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { BannersConfig } from "@/types";

export default function BannersManager({
  initialConfig,
}: {
  initialConfig: BannersConfig;
}) {
  // Estado do Banner Superior (Slim - Acima do Header)
  const [topAtivo, setTopAtivo] = useState(initialConfig.top.ativo);
  const [topDesktop, setTopDesktop] = useState(initialConfig.top.desktop);
  const [topMobile, setTopMobile] = useState(initialConfig.top.mobile);
  const [topLink, setTopLink] = useState(initialConfig.top.link || "");
  const [fileTopDesktop, setFileTopDesktop] = useState<File | null>(null);
  const [fileTopMobile, setFileTopMobile] = useState<File | null>(null);
  const [previewTopDesktop, setPreviewTopDesktop] = useState(initialConfig.top.desktop);
  const [previewTopMobile, setPreviewTopMobile] = useState(initialConfig.top.mobile);

  // Estado do Banner Principal (Hero - Abaixo do Header/Filtros)
  const [heroAtivo, setHeroAtivo] = useState(initialConfig.hero.ativo);
  const [heroDesktop, setHeroDesktop] = useState(initialConfig.hero.desktop);
  const [heroMobile, setHeroMobile] = useState(initialConfig.hero.mobile);
  const [heroLink, setHeroLink] = useState(initialConfig.hero.link || "");
  const [fileHeroDesktop, setFileHeroDesktop] = useState<File | null>(null);
  const [fileHeroMobile, setFileHeroMobile] = useState<File | null>(null);
  const [previewHeroDesktop, setPreviewHeroDesktop] = useState(initialConfig.hero.desktop);
  const [previewHeroMobile, setPreviewHeroMobile] = useState(initialConfig.hero.mobile);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fileTopDesktopRef = useRef<HTMLInputElement>(null);
  const fileTopMobileRef = useRef<HTMLInputElement>(null);
  const fileHeroDesktopRef = useRef<HTMLInputElement>(null);
  const fileHeroMobileRef = useRef<HTMLInputElement>(null);

  // Handlers para arquivos Top
  function handleFileTopDesktop(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFileTopDesktop(file);
      setPreviewTopDesktop(URL.createObjectURL(file));
      setTopAtivo(true);
      setMsg(null);
    }
  }

  function handleFileTopMobile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFileTopMobile(file);
      setPreviewTopMobile(URL.createObjectURL(file));
      setTopAtivo(true);
      setMsg(null);
    }
  }

  // Handlers para arquivos Hero
  function handleFileHeroDesktop(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFileHeroDesktop(file);
      setPreviewHeroDesktop(URL.createObjectURL(file));
      setHeroAtivo(true);
      setMsg(null);
    }
  }

  function handleFileHeroMobile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFileHeroMobile(file);
      setPreviewHeroMobile(URL.createObjectURL(file));
      setHeroAtivo(true);
      setMsg(null);
    }
  }

  // Resets
  function handleResetHero() {
    setFileHeroDesktop(null);
    setFileHeroMobile(null);
    setHeroDesktop("/banner-desktop.png");
    setHeroMobile("/banner-mobile.png");
    setPreviewHeroDesktop("/banner-desktop.png");
    setPreviewHeroMobile("/banner-mobile.png");
    if (fileHeroDesktopRef.current) fileHeroDesktopRef.current.value = "";
    if (fileHeroMobileRef.current) fileHeroMobileRef.current.value = "";
    setMsg(null);
  }

  function handleClearTop() {
    setFileTopDesktop(null);
    setFileTopMobile(null);
    setTopDesktop("");
    setTopMobile("");
    setPreviewTopDesktop("");
    setPreviewTopMobile("");
    setTopAtivo(false);
    if (fileTopDesktopRef.current) fileTopDesktopRef.current.value = "";
    if (fileTopMobileRef.current) fileTopMobileRef.current.value = "";
    setMsg(null);
  }

  async function handleSave() {
    setSaving(true);
    setMsg(null);

    try {
      const formData = new FormData();
      formData.append("topAtivo", topAtivo ? "true" : "false");
      formData.append("topLink", topLink);
      formData.append("topDesktop", topDesktop);
      formData.append("topMobile", topMobile);
      if (fileTopDesktop) formData.append("fileTopDesktop", fileTopDesktop);
      if (fileTopMobile) formData.append("fileTopMobile", fileTopMobile);

      formData.append("heroAtivo", heroAtivo ? "true" : "false");
      formData.append("heroLink", heroLink);
      formData.append("heroDesktop", heroDesktop);
      formData.append("heroMobile", heroMobile);
      if (fileHeroDesktop) formData.append("fileHeroDesktop", fileHeroDesktop);
      if (fileHeroMobile) formData.append("fileHeroMobile", fileHeroMobile);

      const res = await fetch("/api/admin/banners", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Erro ao salvar banners.");
      }

      setFileTopDesktop(null);
      setFileTopMobile(null);
      setFileHeroDesktop(null);
      setFileHeroMobile(null);

      if (data.config) {
        setTopDesktop(data.config.top.desktop);
        setPreviewTopDesktop(data.config.top.desktop);
        setTopMobile(data.config.top.mobile);
        setPreviewTopMobile(data.config.top.mobile);
        setHeroDesktop(data.config.hero.desktop);
        setPreviewHeroDesktop(data.config.hero.desktop);
        setHeroMobile(data.config.hero.mobile);
        setPreviewHeroMobile(data.config.hero.mobile);
      }

      setMsg({
        type: "success",
        text: "Banners e visibilidade salvos com sucesso! As alterações já estão ativas no catálogo.",
      });
    } catch (err: any) {
      setMsg({
        type: "error",
        text: err.message || "Não foi possível salvar os banners.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 pt-4">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold" style={{ color: "var(--ink)" }}>
            Gestão de Banners & Vitrine
          </h2>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--ink-soft)" }}>
            Controle de forma independente o banner superior fino (acima do header) e o banner principal vitrine (abaixo dos filtros).
          </p>
        </div>

        <Link
          href="/"
          target="_blank"
          className="btn-glass rounded-full px-4 py-2 text-xs font-semibold self-start sm:self-auto flex items-center gap-1.5"
        >
          <span>Ver catálogo</span>
          <span>↗</span>
        </Link>
      </div>

      {/* Alerta de Feedback */}
      {msg && (
        <div
          className={`p-3.5 mb-6 rounded-xl text-xs sm:text-sm font-medium border animate-fade-in ${
            msg.type === "success"
              ? "bg-teal-50 text-teal-800 border-teal-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="space-y-8">
        {/* =================================================================== */}
        {/* SEÇÃO 1: BANNER SUPERIOR FINO (ACIMA DO HEADER) */}
        {/* =================================================================== */}
        <div className="glass rounded-2xl p-5 sm:p-6 border border-black/5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg">📢</span>
                <h3 className="text-base sm:text-lg font-bold text-stone-900">
                  Banner Superior Fino (Acima do Header)
                </h3>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--ink-soft)" }}>
                Faixa fina no topo absoluto da página. Ideal para avisos rápidos, frete grátis, cupons ou garantia de originalidade.
              </p>
            </div>

            {/* Switch Ligar/Desligar */}
            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-xs font-semibold ${topAtivo ? "text-teal-700" : "text-stone-400"}`}>
                {topAtivo ? "Banner Ativo" : "Desativado"}
              </span>
              <button
                type="button"
                onClick={() => setTopAtivo(!topAtivo)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  topAtivo ? "bg-[#3f6b62]" : "bg-stone-300"
                }`}
                role="switch"
                aria-checked={topAtivo}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    topAtivo ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Conteúdo do Banner Superior */}
          <div className={`mt-5 transition-opacity ${topAtivo ? "opacity-100" : "opacity-60"}`}>
            {/* Dica de Resolução */}
            <div className="p-3 mb-5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs">
              <p className="font-bold flex items-center gap-1 mb-1">
                <span>📏</span> Padrão de Mercado Recomendado (Banner Fino):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-amber-800/90 leading-relaxed mt-1">
                <div>
                  • <b>Desktop:</b> <b>1920 × 80 px</b> (ou 2560 × 88 px) — Altura fina de ~40px no site.
                </div>
                <div>
                  • <b>Mobile:</b> <b>1080 × 120 px</b> — Altura fina de ~38px no smartphone.
                </div>
              </div>
            </div>

            {/* Grid Desktop e Mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Desktop */}
              <div className="p-4 rounded-xl bg-stone-50/80 border border-stone-200/80">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-stone-800">Versão Desktop (Computador)</p>
                  <span className="text-[10px] text-stone-500 font-medium">1920 × 80 px</span>
                </div>

                <div className="w-full bg-[#507b1f] rounded-lg overflow-hidden border border-black/10 min-h-[46px] flex items-center justify-center p-1 mb-3">
                  {previewTopDesktop ? (
                    <img
                      src={previewTopDesktop}
                      alt="Preview Top Desktop"
                      className="w-full h-[40px] object-cover"
                    />
                  ) : (
                    <span className="text-[11px] text-white/70 italic">Nenhuma imagem carregada</span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <input
                    type="file"
                    ref={fileTopDesktopRef}
                    onChange={handleFileTopDesktop}
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    id="upload-top-desktop"
                  />
                  <label
                    htmlFor="upload-top-desktop"
                    className="btn-glass rounded-full px-4 py-2 text-xs font-semibold cursor-pointer text-stone-800 hover:bg-white inline-flex items-center gap-1.5"
                  >
                    <span>{fileTopDesktop ? "Trocar arquivo" : "Escolher arquivo"}</span>
                  </label>
                  {previewTopDesktop && (
                    <button
                      type="button"
                      onClick={() => {
                        setFileTopDesktop(null);
                        setTopDesktop("");
                        setPreviewTopDesktop("");
                      }}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile */}
              <div className="p-4 rounded-xl bg-stone-50/80 border border-stone-200/80">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-stone-800">Versão Mobile (Celular)</p>
                  <span className="text-[10px] text-stone-500 font-medium">1080 × 120 px</span>
                </div>

                <div className="w-full max-w-[340px] mx-auto bg-[#507b1f] rounded-lg overflow-hidden border border-black/10 min-h-[46px] flex items-center justify-center p-1 mb-3">
                  {previewTopMobile ? (
                    <img
                      src={previewTopMobile}
                      alt="Preview Top Mobile"
                      className="w-full h-[38px] object-cover"
                    />
                  ) : (
                    <span className="text-[11px] text-white/70 italic">Nenhuma imagem carregada</span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <input
                    type="file"
                    ref={fileTopMobileRef}
                    onChange={handleFileTopMobile}
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    id="upload-top-mobile"
                  />
                  <label
                    htmlFor="upload-top-mobile"
                    className="btn-glass rounded-full px-4 py-2 text-xs font-semibold cursor-pointer text-stone-800 hover:bg-white inline-flex items-center gap-1.5"
                  >
                    <span>{fileTopMobile ? "Trocar arquivo" : "Escolher foto da galeria"}</span>
                  </label>
                  {previewTopMobile && (
                    <button
                      type="button"
                      onClick={() => {
                        setFileTopMobile(null);
                        setTopMobile("");
                        setPreviewTopMobile("");
                      }}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Link Opcional ao Clicar */}
            <div className="mt-4 pt-3 border-t border-black/5">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Link de Destino ao Clicar (Opcional):
              </label>
              <input
                type="text"
                placeholder="Ex: https://wa.me/5545999736188 ou /#novidades"
                value={topLink}
                onChange={(e) => setTopLink(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-xs border border-stone-300 bg-white focus:ring-1 focus:ring-[var(--teal-deep)]"
              />
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* SEÇÃO 2: BANNER PRINCIPAL VITRINE (ABAIXO DO HEADER / FILTROS) */}
        {/* =================================================================== */}
        <div className="glass rounded-2xl p-5 sm:p-6 border border-black/5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg">🖼️</span>
                <h3 className="text-base sm:text-lg font-bold text-stone-900">
                  Banner Principal Vitrine (Abaixo do Header e Filtros)
                </h3>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--ink-soft)" }}>
                Grande destaque visual exibido na página inicial logo abaixo dos filtros. Ideal para campanhas e apresentação dos decants.
              </p>
            </div>

            {/* Switch Ligar/Desligar */}
            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-xs font-semibold ${heroAtivo ? "text-teal-700" : "text-stone-400"}`}>
                {heroAtivo ? "Banner Ativo" : "Desativado"}
              </span>
              <button
                type="button"
                onClick={() => setHeroAtivo(!heroAtivo)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  heroAtivo ? "bg-[#3f6b62]" : "bg-stone-300"
                }`}
                role="switch"
                aria-checked={heroAtivo}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    heroAtivo ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Conteúdo do Banner Hero */}
          <div className={`mt-5 transition-opacity ${heroAtivo ? "opacity-100" : "opacity-60"}`}>
            {/* Dica de Resolução */}
            <div className="p-3 mb-5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs">
              <p className="font-bold flex items-center gap-1 mb-1">
                <span>📏</span> Padrão de Mercado Recomendado (Hero Banner Vitrine):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-amber-800/90 leading-relaxed mt-1">
                <div>
                  • <b>Desktop (4:1):</b> <b>1920 × 480 px</b> ou <b>2048 × 512 px</b> — Mantém os perfumes visíveis na primeira rolagem.
                </div>
                <div>
                  • <b>Mobile (2:1):</b> <b>1080 × 540 px</b> — Altura de ~180px no celular sem empurrar a grade de produtos.
                </div>
              </div>
            </div>

            {/* Grid Desktop e Mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Desktop */}
              <div className="p-4 rounded-xl bg-stone-50/80 border border-stone-200/80">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-stone-800">Versão Desktop (Computador)</p>
                  <span className="text-[10px] text-stone-500 font-medium">1920 × 480 px (4:1)</span>
                </div>

                <div className="w-full bg-[#507b1f] rounded-lg overflow-hidden border border-black/10 min-h-[90px] flex items-center justify-center p-1.5 mb-3">
                  {previewHeroDesktop ? (
                    <img
                      src={previewHeroDesktop}
                      alt="Preview Hero Desktop"
                      className="w-full h-auto max-h-[140px] object-contain mx-auto"
                    />
                  ) : (
                    <span className="text-[11px] text-white/70 italic">Nenhuma imagem carregada</span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <input
                    type="file"
                    ref={fileHeroDesktopRef}
                    onChange={handleFileHeroDesktop}
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    id="upload-hero-desktop"
                  />
                  <label
                    htmlFor="upload-hero-desktop"
                    className="btn-teal rounded-full px-4 py-2 text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  >
                    <span>{fileHeroDesktop ? "Trocar arquivo" : "Escolher nova imagem"}</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleResetHero}
                    className="text-xs text-stone-500 hover:text-stone-800"
                  >
                    Restaurar padrão
                  </button>
                </div>
              </div>

              {/* Mobile */}
              <div className="p-4 rounded-xl bg-stone-50/80 border border-stone-200/80">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-stone-800">Versão Mobile (Celular)</p>
                  <span className="text-[10px] text-stone-500 font-medium">1080 × 540 px (2:1)</span>
                </div>

                <div className="w-full max-w-[340px] mx-auto bg-[#507b1f] rounded-lg overflow-hidden border border-black/10 min-h-[90px] flex items-center justify-center p-1.5 mb-3">
                  {previewHeroMobile ? (
                    <img
                      src={previewHeroMobile}
                      alt="Preview Hero Mobile"
                      className="w-full h-auto max-h-[140px] object-contain mx-auto"
                    />
                  ) : (
                    <span className="text-[11px] text-white/70 italic">Nenhuma imagem carregada</span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <input
                    type="file"
                    ref={fileHeroMobileRef}
                    onChange={handleFileHeroMobile}
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    id="upload-hero-mobile"
                  />
                  <label
                    htmlFor="upload-hero-mobile"
                    className="btn-teal rounded-full px-4 py-2 text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  >
                    <span>{fileHeroMobile ? "Trocar arquivo" : "Escolher foto da galeria"}</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleResetHero}
                    className="text-xs text-stone-500 hover:text-stone-800"
                  >
                    Restaurar padrão
                  </button>
                </div>
              </div>
            </div>

            {/* Link Opcional ao Clicar */}
            <div className="mt-4 pt-3 border-t border-black/5">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Link de Destino ao Clicar (Opcional):
              </label>
              <input
                type="text"
                placeholder="Ex: /#nicho ou https://wa.me/..."
                value={heroLink}
                onChange={(e) => setHeroLink(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-xs border border-stone-300 bg-white focus:ring-1 focus:ring-[var(--teal-deep)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Salvamento Geral */}
      <div className="mt-8 pt-5 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-stone-500 order-2 sm:order-1 text-center sm:text-left">
          Clique no botão para salvar as configurações de exibição e os novos arquivos enviados.
        </p>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto btn-teal rounded-full px-8 py-3 text-sm font-bold shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed order-1 sm:order-2 flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Salvando e publicando...</span>
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <span>Salvar Todas as Alterações</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
