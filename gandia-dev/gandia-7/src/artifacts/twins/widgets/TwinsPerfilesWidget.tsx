/**
 * TwinsPerfilesWidget
 * ARCHIVO → src/artifacts/twins/widgets/TwinsPerfilesWidget.tsx
 *
 * Lista de animales. Emite onSelect al padre — el módulo/anima maneja el contexto.
 * Sin emojis. Conectado a Supabase via useTwinsData.ts
 */

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

      {/* Lista */}
      {animales.map((item) => {
        const prog = Math.round(
          ((item.perfil.pesoActual - item.perfil.pesoNacimiento) /
            (item.perfil.pesoMeta - item.perfil.pesoNacimiento)) *
            100,
        );
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
