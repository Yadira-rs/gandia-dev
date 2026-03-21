/**
 * GemelosAnima.tsx
 * Nivel Ánima — Gemelo Digital
 * ARCHIVO → src/artifacts/twins/GemelosAnima.tsx
 *
 * ✅ Conectado a Supabase — sin mock data
 */
import { useState, useEffect } from "react";
import CopiloAnima from "../CopiloAnima";

import TwinsTimelineWidget from "./widgets/TwinsTimelineWidget";
import TwinsAlimentacionWidget from "./widgets/TwinsAlimentacionWidget";
import TwinsFeedWidget from "./widgets/TwinsFeedWidget";
import TwinsPerfilesWidget, {
  type AnimalListItem,
} from "./widgets/TwinsPerfilesWidget";
import TwinsHeroWidget from "./widgets/TwinsHeroWidget";
import TwinsPesoWidget from "./widgets/TwinsPesoWidget";

import {
  useTwinsAnimales,
  useTwinsPesos,
  useTwinsTimeline,
  useTwinsAlimentacion,
  useTwinsFeed,
} from "../../hooks/useTwinsData";

import {
  useAnimalesList,
  useRanchoId,
  getAuthUserId,
} from "../../hooks/useAnimales";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

type Tab = "perfil" | "timeline" | "alimentacion" | "auditorias";

interface Props {
  onClose: () => void;
  onEscalate: () => void;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function LoadingState({ mensaje }: { mensaje: string }) {
  return (
    <div className="flex items-center gap-2 py-10 justify-center">
      <span className="w-2 h-2 rounded-full bg-[#2FAF8F] animate-pulse" />
      <span className="text-[12px] text-stone-400 dark:text-stone-500">
        {mensaje}
      </span>
    </div>
  );
}

function EmptyState({ mensaje }: { mensaje: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-stone-300 dark:text-stone-700"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span className="text-[12px] text-stone-400 dark:text-stone-500">
        {mensaje}
      </span>
    </div>
  );
}

function IcoCopy() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#2FAF8F"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export default function GemelosAnima({ onClose, onEscalate }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("perfil");
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalListItem | null>(
    null,
  );
  const [userId, setUserId] = useState<string | null>(null);

  // 1. userId de la sesión activa
  useEffect(() => {
    getAuthUserId().then(setUserId);
  }, []);

  // 2. ranchoId del usuario
  const { ranchoId } = useRanchoId(userId);

  // 3. Lista de animales
  const { animales, loading: loadingAnimales } = useTwinsAnimales(ranchoId);

  // 4. UUID del animal seleccionado
  const { animales: animalesDB } = useAnimalesList(ranchoId);
  const animalUUID = selectedAnimal
    ? (animalesDB.find((a) => a.siniiga === selectedAnimal.perfil.arete)?.id ??
      null)
    : null;
  const animalSiniiga = selectedAnimal?.perfil.arete ?? null;

  // 5. Datos por widget
  const { registros, loading: loadingPesos } = useTwinsPesos(animalUUID);
  const { eventos, loading: loadingTimeline } = useTwinsTimeline(animalSiniiga);
  const { datos, loading: loadingAlim } = useTwinsAlimentacion(
    animalUUID,
    selectedAnimal?.perfil.pesoActual,
    selectedAnimal?.perfil.pesoMeta,
    selectedAnimal?.perfil.gananciaDiaria,
  );
  const { auditorias, completitud } = useTwinsFeed(animalSiniiga);

  const pendientesAudit = auditorias.filter(
    (a: { estado: string }) => a.estado === "incompleto",
  ).length;

  const TABS: { key: Tab; label: string; alerta?: boolean }[] = [
    { key: "perfil", label: "Perfil" },
    { key: "timeline", label: "Timeline" },
    { key: "alimentacion", label: "Alimentación" },
    { key: "auditorias", label: "Auditorías", alerta: pendientesAudit > 0 },
  ];

  return (
    <div className="fixed inset-0 flex flex-col z-50 bg-stone-50 dark:bg-[#0e0d0c]">
      {/* TOPBAR */}
      <div className="h-[52px] flex items-center px-5 border-b border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] shrink-0 relative gap-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <IcoCopy />
          <span className="text-[13px] font-bold text-stone-700 dark:text-stone-200">
            Gemelo Digital
          </span>
          {selectedAnimal && (
            <>
              <span className="hidden md:inline text-[12px] text-stone-300 dark:text-stone-600">
                ·
              </span>
              <span className="hidden md:inline font-mono text-[12px] text-stone-400 dark:text-stone-500">
                {selectedAnimal.perfil.arete}
              </span>
              {selectedAnimal.perfil.nombre && (
                <span className="hidden md:inline text-[12px] text-stone-400 dark:text-stone-500">
                  {selectedAnimal.perfil.nombre}
                </span>
              )}
              {selectedAnimal.perfil.alertas > 0 && (
                <span className="hidden md:inline text-[10px] font-medium text-amber-500 dark:text-amber-400 ml-1">
                  · {selectedAnimal.perfil.alertas} alerta
                </span>
              )}
            </>
          )}
        </div>

        {/* Tabs centrados */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 gap-0.5 bg-stone-100 dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/60 rounded-[12px] p-[3px]">
          {TABS.map((t) => {
            const disabled = t.key !== "perfil" && !selectedAnimal;
            return (
              <button
                key={t.key}
                onClick={() => !disabled && setActiveTab(t.key)}
                className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-[9px] border-0 text-[12px] transition-all
                  ${
                    disabled
                      ? "text-stone-300 dark:text-stone-700 cursor-not-allowed bg-transparent"
                      : activeTab === t.key
                        ? "bg-white dark:bg-[#1c1917] text-stone-700 dark:text-stone-200 font-semibold shadow-sm cursor-pointer"
                        : "bg-transparent text-stone-400 dark:text-stone-500 font-normal hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer"
                  }`}
              >
                {t.label}
                {t.alerta && !disabled && (
                  <span className="absolute -top-[3px] -right-[3px] w-[7px] h-[7px] rounded-full bg-amber-400 border-[1.5px] border-white dark:border-[#141210]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Acciones derecha */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={onEscalate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-[12px] text-stone-400 dark:text-stone-500 cursor-pointer hover:text-[#2FAF8F] hover:border-[#2FAF8F]/40 transition-all"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <polyline points="4 14 10 14 10 20" />
              <polyline points="20 10 14 10 14 4" />
              <line x1="10" y1="14" x2="17" y2="7" />
              <line x1="4" y1="20" x2="11" y2="13" />
            </svg>
            Espacio Gandia
          </button>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-[10px] border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-[12px] text-stone-400 dark:text-stone-500 cursor-pointer hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
          >
            Chat
          </button>
        </div>
      </div>

      {/* BODY */}
      <div
        className="flex-1 min-h-0 overflow-y-auto
        [&::-webkit-scrollbar]:w-[3px]
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-stone-200
        [&::-webkit-scrollbar-thumb]:dark:bg-stone-700/80
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb:hover]:bg-[#2FAF8F]/60
        [&::-webkit-scrollbar-thumb:hover]:dark:bg-[#2FAF8F]/50"
      >
        <div className="max-w-2xl mx-auto px-4 py-5">
          {/* ── PERFIL ── */}
          {activeTab === "perfil" &&
            (loadingAnimales ? (
              <LoadingState mensaje="Cargando animales..." />
            ) : selectedAnimal ? (
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setSelectedAnimal(null)}
                  className="flex items-center gap-1.5 text-[12px] text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors bg-transparent border-0 cursor-pointer w-fit"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <polyline points="15 19 8 12 15 5" />
                  </svg>
                  Todos los animales
                </button>
                <TwinsHeroWidget perfil={selectedAnimal.perfil} />
                {loadingPesos ? (
                  <LoadingState mensaje="Cargando curva de peso..." />
                ) : registros.length > 0 ? (
                  <TwinsPesoWidget
                    registros={registros}
                    pesoMeta={selectedAnimal.perfil.pesoMeta}
                    gananciaDiaria={selectedAnimal.perfil.gananciaDiaria}
                  />
                ) : (
                  <EmptyState mensaje="Sin registros de peso aún" />
                )}
              </div>
            ) : (
              <TwinsPerfilesWidget
                animales={animales}
                selected={selectedAnimal}
                onSelect={setSelectedAnimal}
              />
            ))}

          {/* ── TIMELINE ── */}
          {activeTab === "timeline" &&
            (loadingTimeline ? (
              <LoadingState mensaje="Cargando historial..." />
            ) : eventos.length > 0 ? (
              <TwinsTimelineWidget
                eventos={eventos}
                ubicacionActual={selectedAnimal?.perfil.corral ?? "—"}
              />
            ) : (
              <EmptyState mensaje="Sin eventos registrados" />
            ))}

          {/* ── ALIMENTACIÓN ── */}
          {activeTab === "alimentacion" &&
            (loadingAlim ? (
              <LoadingState mensaje="Cargando alimentación..." />
            ) : datos ? (
              <TwinsAlimentacionWidget datos={datos} />
            ) : (
              <EmptyState mensaje="Sin datos de alimentación" />
            ))}

          {/* ── AUDITORÍAS ── */}
          {activeTab === "auditorias" && (
            <TwinsFeedWidget
              auditorias={auditorias}
              completitud={completitud}
            />
          )}
        </div>
      </div>

      {/* NAV MÓVIL */}
      <div className="md:hidden shrink-0 flex items-center bg-white dark:bg-[#141210] border-t border-stone-200/60 dark:border-stone-800/50">
        {TABS.map((t) => {
          const disabled = t.key !== "perfil" && !selectedAnimal;
          return (
            <button
              key={t.key}
              onClick={() => !disabled && setActiveTab(t.key)}
              className={`relative flex-1 py-3 text-[11px] font-medium transition-colors bg-transparent border-0
                ${
                  disabled
                    ? "text-stone-300 dark:text-stone-700 cursor-not-allowed"
                    : activeTab === t.key
                      ? "text-stone-800 dark:text-stone-100 cursor-pointer"
                      : "text-stone-400 dark:text-stone-500 cursor-pointer"
                }`}
            >
              {t.label}
              {activeTab === t.key && !disabled && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#2FAF8F] rounded-full" />
              )}
              {t.alerta && !disabled && (
                <span className="absolute top-2 right-1/2 translate-x-3 w-[5px] h-[5px] rounded-full bg-amber-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* COPILOTO */}
      <CopiloAnima domain="twins" />
    </div>
  );
}
