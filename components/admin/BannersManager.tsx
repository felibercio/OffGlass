"use client";

import { useState, useRef } from "react";
import Link from "next/link";

interface BannersManagerProps {
  initialBannerDesktop: string;
  initialBannerMobile: string;
}

export default function BannersManager({
  initialBannerDesktop,
  initialBannerMobile,
}: BannersManagerProps) {
  // URLs ativas salvas
  const [bannerDesktop, setBannerDesktop] = useState(initialBannerDesktop);
  const [bannerMobile, setBannerMobile] = useState(initialBannerMobile);

  // Arquivos selecionados localmente (aguardando salvamento)
  const [fileDesktop, setFileDesktop] = useState<File | null>(null);
  const [fileMobile, setFileMobile] = useState<File | null>(null);

  // Previews locais em tempo real
  const [previewDesktop, setPreviewDesktop] = useState(initialBannerDesktop);
  const [previewMobile, setPreviewMobile] = useState(initialBannerMobile);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  function handleDesktopFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFileDesktop(file);
      const url = URL.createObjectURL(file);
      setPreviewDesktop(url);
      setMsg(null);
    }
  }

  function handleMobileFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFileMobile(file);
      const url = URL.createObjectURL(file);
      setPreviewMobile(url);
      setMsg(null);
    }
  }

  function handleResetDesktop() {
    setFileDesktop(null);
    setBannerDesktop("/banner-desktop.png");
    setPreviewDesktop("/banner-desktop.png");
    if (desktopInputRef.current) desktopInputRef.current.value = "";
    setMsg(null);
  }

  function handleResetMobile() {
    setFileMobile(null);
    setBannerMobile("/banner-mobile.png");
    setPreviewMobile("/banner-mobile.png");
    if (mobileInputRef.current) mobileInputRef.current.value = "";
    setMsg(null);
  }

  async function handleSave() {
    setSaving(true);
    setMsg(null);

    try {
      const formData = new FormData();
      if (fileDesktop) {
        formData.append("fileDesktop", fileDesktop);
      } else {
        formData.append("bannerDesktop", bannerDesktop);
      }

      if (fileMobile) {
        formData.append("fileMobile", fileMobile);
      } else {
        formData.append("bannerMobile", bannerMobile);
      }

      const res = await fetch("/api/admin/banners", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Erro ao salvar banners.");
      }

      setBannerDesktop(data.bannerDesktop);
      setPreviewDesktop(data.bannerDesktop);
      setBannerMobile(data.bannerMobile);
      setPreviewMobile(data.bannerMobile);
      setFileDesktop(null);
      setFileMobile(null);

      setMsg({
        type: "success",
        text: "Banners atualizados com sucesso! A alteração já está refletida no catálogo.",
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

  const hasPendingChanges =
    fileDesktop !== null ||
    fileMobile !== null ||
    bannerDesktop !== initialBannerDesktop ||
    bannerMobile !== initialBannerMobile;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 pt-4">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold" style={{ color: "var(--ink)" }}>
            Banners do Topo
          </h2>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--ink-soft)" }}>
            Altere as imagens de destaque exibidas no cabeçalho do catálogo para computadores e celulares.
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

      {/* Alerta de Sucesso ou Erro */}
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

      {/* Grid de Cards dos Banners (1 coluna no celular, 2 colunas no desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ======================================================== */}
        {/* CARD 1: BANNER DESKTOP */}
        {/* ======================================================== */}
        <div className="glass rounded-2xl p-4 sm:p-6 flex flex-col justify-between h-full border border-black/5 shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg">💻</span>
                <h3 className="text-sm sm:text-base font-semibold text-stone-900">
                  Banner Desktop (Computador)
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                Telas $\ge$ 768px
              </span>
            </div>

            <p className="text-xs mb-4" style={{ color: "var(--ink-soft)" }}>
              Exibido em computadores, notebooks e tablets em modo paisagem.
            </p>

            {/* Pré-visualização com aspect ratio do Desktop (~5:1) */}
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-stone-500 mb-1.5 uppercase tracking-wider">
                Pré-visualização ao vivo:
              </p>
              <div className="w-full bg-[#507b1f] rounded-xl overflow-hidden border border-black/10 shadow-inner flex items-center justify-center p-1 sm:p-2">
                <img
                  src={previewDesktop}
                  alt="Preview Desktop"
                  className="w-full h-auto max-h-[140px] object-contain mx-auto"
                />
              </div>
              {fileDesktop && (
                <p className="text-[11px] text-teal-700 font-semibold mt-1.5 flex items-center gap-1">
                  <span>●</span> Novo arquivo pronto para envio: {fileDesktop.name} ({(fileDesktop.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>

            {/* Dica de Resolução Retina */}
            <div className="p-3 mb-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs">
              <p className="font-bold flex items-center gap-1 mb-1">
                <span>✨</span> Resolução Recomendada para Máxima Nitidez:
              </p>
              <ul className="space-y-1 list-disc list-inside text-[11px] text-amber-800/90 leading-relaxed">
                <li>
                  Tamanho ideal: <b>2048 × 396 px</b> ou <b>2560 × 496 px</b> (proporção ~5:1).
                </li>
                <li>
                  No <b>Canva</b> ou <b>Figma</b>: ao exportar em PNG, escolha a escala <b>2x</b> para garantir nitidez perfeita em MacBooks e telas Retina.
                </li>
              </ul>
            </div>
          </div>

          {/* Ações de Upload e Reset Desktop */}
          <div className="pt-3 border-t border-black/5 flex flex-wrap items-center justify-between gap-2">
            <input
              type="file"
              ref={desktopInputRef}
              onChange={handleDesktopFileChange}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              id="upload-desktop-banner"
            />
            <label
              htmlFor="upload-desktop-banner"
              className="btn-teal rounded-full px-4 py-2.5 text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>{fileDesktop ? "Trocar arquivo" : "Escolher nova imagem"}</span>
            </label>

            <button
              type="button"
              onClick={handleResetDesktop}
              className="text-xs font-semibold text-stone-500 hover:text-stone-800 px-3 py-1.5 rounded-full hover:bg-black/5 cursor-pointer transition-colors"
            >
              Restaurar padrão
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* CARD 2: BANNER MOBILE */}
        {/* ======================================================== */}
        <div className="glass rounded-2xl p-4 sm:p-6 flex flex-col justify-between h-full border border-black/5 shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg">📱</span>
                <h3 className="text-sm sm:text-base font-semibold text-stone-900">
                  Banner Mobile (Celular)
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                Telas &lt; 768px
              </span>
            </div>

            <p className="text-xs mb-4" style={{ color: "var(--ink-soft)" }}>
              Exibido na tela de smartphones (iPhone, Android, telas verticais).
            </p>

            {/* Pré-visualização com aspect ratio do Mobile (~2.35:1) */}
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-stone-500 mb-1.5 uppercase tracking-wider">
                Pré-visualização ao vivo:
              </p>
              <div className="w-full max-w-[340px] mx-auto bg-[#507b1f] rounded-xl overflow-hidden border border-black/10 shadow-inner flex items-center justify-center p-1 sm:p-2">
                <img
                  src={previewMobile}
                  alt="Preview Mobile"
                  className="w-full h-auto max-h-[160px] object-contain mx-auto"
                />
              </div>
              {fileMobile && (
                <p className="text-[11px] text-teal-700 font-semibold mt-1.5 flex items-center gap-1 justify-center">
                  <span>●</span> Novo arquivo pronto para envio: {fileMobile.name} ({(fileMobile.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>

            {/* Dica de Resolução Mobile */}
            <div className="p-3 mb-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs">
              <p className="font-bold flex items-center gap-1 mb-1">
                <span>✨</span> Resolução Recomendada para Celulares OLED/Retina:
              </p>
              <ul className="space-y-1 list-disc list-inside text-[11px] text-amber-800/90 leading-relaxed">
                <li>
                  Tamanho ideal: <b>1080 × 460 px</b> ou <b>1200 × 510 px</b> (proporção ~2.35:1).
                </li>
                <li>
                  No <b>Canva</b> ou <b>Figma</b>: exportar com largura de 1080px garante texto 100% nítido em iPhones com telas Super Retina de 3x.
                </li>
              </ul>
            </div>
          </div>

          {/* Ações de Upload e Reset Mobile */}
          <div className="pt-3 border-t border-black/5 flex flex-wrap items-center justify-between gap-2">
            <input
              type="file"
              ref={mobileInputRef}
              onChange={handleMobileFileChange}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              id="upload-mobile-banner"
            />
            <label
              htmlFor="upload-mobile-banner"
              className="btn-teal rounded-full px-4 py-2.5 text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>{fileMobile ? "Trocar arquivo" : "Escolher foto da galeria"}</span>
            </label>

            <button
              type="button"
              onClick={handleResetMobile}
              className="text-xs font-semibold text-stone-500 hover:text-stone-800 px-3 py-1.5 rounded-full hover:bg-black/5 cursor-pointer transition-colors"
            >
              Restaurar padrão
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Ação de Salvamento Principal (Fixo/Destacado no mobile e desktop) */}
      <div className="mt-8 pt-5 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-stone-500 order-2 sm:order-1 text-center sm:text-left">
          {hasPendingChanges
            ? "Você possui alterações pendentes. Clique no botão ao lado para salvar."
            : "Nenhuma alteração pendente. Os banners ativos estão sincronizados."}
        </p>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !hasPendingChanges}
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
              <span>Salvar Alterações dos Banners</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

