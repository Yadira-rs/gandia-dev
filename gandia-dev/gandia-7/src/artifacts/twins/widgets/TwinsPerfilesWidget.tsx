/**
 * TwinsPerfilesWidget
 * ARCHIVO → src/artifacts/twins/widgets/TwinsPerfilesWidget.tsx
 *
 * Lista de animales. Emite onSelect al padre.
 * Sin emojis. Conectado a Supabase via useTwinsData.ts
 *
 * FIXES v4:
 * - Empty state cuando animales = []
 * - Búsqueda local por arete, nombre, raza y corral
 * - Progreso consistente: (actual - nacimiento) / (meta - nacimiento) (antes quedaba vacío sin mensaje)
 * - Progreso consistente: (actual - nacimiento) / (meta - nacimiento)
 */

import { useState } from "react";
import type { AnimalPerfil } from "./TwinsHeroWidget";
import type { RegistroPeso } from "./TwinsPesoWidget";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface AnimalListItem {
  perfil: AnimalPerfil;
  pesos: RegistroPeso[];
}

interface Props {
  animales: AnimalListItem[];
  selected?: AnimalListItem | null;
  onSelect: (item: AnimalListItem) => void;
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const ESTADO_CFG: Record<string, { label: string; color: string }> = {
  engorda: { label: "Engorda", color: "text-[#2FAF8F]" },
  cría: { label: "Cría", color: "text-indigo-500 dark:text-indigo-400" },
  reproducción: {
    label: "Reproducción",
    color: "text-violet-500 dark:text-violet-400",
  },
  cuarentena: {
    label: "Cuarentena",
    color: "text-amber-500 dark:text-amber-400",
  },
};

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export default function TwinsPerfilesWidget({
  animales,
  selected,
  onSelect,
}: Props) {
  // FIX: empty state explícito en lugar de silencio total
  if (animales.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[13.5px] font-semibold text-stone-800 dark:text-stone-100">
            Animales registrados
          </p>
          <span className="font-mono text-[11px] text-stone-400 dark:text-stone-500">
            0 animales
          </span>
        </div>
        <div className="flex flex-col items-center gap-2 py-10 bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[12px]">
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
            Sin animales registrados en este rancho
          </span>
        </div>
      </div>
    );
  }

  const [busqueda, setBusqueda] = useState("");
  const animalesFiltrados = busqueda.trim()
    ? animales.filter(
        (a) =>
          a.perfil.arete.toLowerCase().includes(busqueda.toLowerCase()) ||
          (a.perfil.nombre ?? "")
            .toLowerCase()
            .includes(busqueda.toLowerCase()) ||
          a.perfil.raza.toLowerCase().includes(busqueda.toLowerCase()) ||
          a.perfil.corral.toLowerCase().includes(busqueda.toLowerCase()),
      )
    : animales;

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-[13.5px] font-semibold text-stone-800 dark:text-stone-100">
          Animales registrados
        </p>
        <span className="font-mono text-[11px] text-stone-400 dark:text-stone-500">
          {animales.length} animales
        </span>
      </div>

      {/* Búsqueda local */}
      <div className="relative">
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-300 dark:text-stone-600 shrink-0"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Buscar por arete, nombre, raza…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-[12px] bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[10px] text-stone-700 dark:text-stone-200 placeholder-stone-300 dark:placeholder-stone-600 outline-none focus:border-[#2FAF8F]/50 transition-colors"
        />
        {busqueda && (
          <button
            onClick={() => setBusqueda("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-300 dark:text-stone-600 hover:text-stone-400 bg-transparent border-0 cursor-pointer p-0"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {animalesFiltrados.length === 0 && busqueda && (
        <div className="py-6 text-center text-[12px] text-stone-400 dark:text-stone-500">
          Sin resultados para &ldquo;{busqueda}&rdquo;
        </div>
      )}

      {/* Lista */}
      {animalesFiltrados.map((item) => {
        // FIX: mismo cálculo que TwinsHeroWidget — (actual - nacimiento) / (meta - nacimiento)
        const _rango = item.perfil.pesoMeta - item.perfil.pesoNacimiento;
        const prog =
          _rango > 0
            ? Math.min(
                100,
                Math.round(
                  ((item.perfil.pesoActual - item.perfil.pesoNacimiento) /
                    _rango) *
                    100,
                ),
              )
            : 0;

        const estadoCfg = ESTADO_CFG[item.perfil.estado] ?? {
          label: item.perfil.estado,
          color: "text-stone-400",
        };
        const isActive = selected?.perfil.arete === item.perfil.arete;

        return (
          <button
            key={item.perfil.arete}
            onClick={() => onSelect(item)}
            className={`w-full text-left rounded-[12px] px-4 py-3.5 transition-all cursor-pointer border
              ${
                isActive
                  ? "bg-white dark:bg-[#1c1917] border-[#2FAF8F]/50 shadow-sm"
                  : "bg-white dark:bg-[#1c1917] border-stone-200/60 dark:border-stone-800/50 hover:border-[#2FAF8F]/40 hover:shadow-sm"
              }`}
          >
            <div className="flex items-start justify-between gap-3">
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F] shrink-0" />
                  )}
                  <span className="font-mono text-[13px] font-bold text-stone-800 dark:text-stone-100">
                    {item.perfil.arete}
                  </span>
                  {item.perfil.nombre && (
                    <span className="text-[12px] text-stone-400 dark:text-stone-500">
                      {item.perfil.nombre}
                    </span>
                  )}
                  {item.perfil.alertas > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-500 dark:text-amber-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      {item.perfil.alertas}
                    </span>
                  )}
                </div>
                <p className="text-[11.5px] text-stone-400 dark:text-stone-500 truncate">
                  {item.perfil.raza} · {item.perfil.sexo} · {item.perfil.corral}
                </p>
              </div>

              {/* Peso + estado */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="font-mono text-[15px] font-bold text-stone-800 dark:text-stone-100">
                  {item.perfil.pesoActual}{" "}
                  <span className="text-[11px] font-normal text-stone-400">
                    kg
                  </span>
                </span>
                <span
                  className={`text-[10px] font-semibold ${estadoCfg.color}`}
                >
                  {estadoCfg.label}
                </span>
              </div>
            </div>

            {/* Barra progreso */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-stone-400 dark:text-stone-600">
                  Meta {item.perfil.pesoMeta} kg
                </span>
                <span className="text-[10px] font-semibold text-[#2FAF8F]">
                  {prog}%
                </span>
              </div>
              <div className="h-1 bg-stone-100 dark:bg-stone-800/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2FAF8F] rounded-full"
                  style={{ width: `${prog}%` }}
                />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}