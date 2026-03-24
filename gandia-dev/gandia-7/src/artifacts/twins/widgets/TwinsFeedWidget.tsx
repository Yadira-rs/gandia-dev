/**
 * TwinsFeedWidget
 * ARCHIVO → src/artifacts/twins/widgets/TwinsFeedWidget.tsx
 *
 * Auditorías y evidencias con jerarquía visual clara.
 * Sin emojis. Conectado a Supabase via useTwinsData.ts
 *
 * FIXES:
 * - Barra de completitud ahora usa el prop `completitud` real (no conteo de tarjetas)
 * - onSelect se pasa correctamente al padre
 */
import { useState } from "react";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export type AuditoriaEstado = "aprobado" | "coincide" | "incompleto";

export interface Auditoria {
  id: number;
  nombre: string;
  sub: string;
  fecha: string;
  estado: AuditoriaEstado;
  pills: { label: string; ok: boolean }[];
  hash: string;
  hashOk: boolean;
  icono?: string;
}

interface Props {
  auditorias: Auditoria[];
  completitud: number;
  onSelect?: (a: Auditoria) => void;
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const ESTADO_CFG: Record<
  AuditoriaEstado,
  {
    label: string;
    text: string;
    bg: string;
    leftBorder: string;
    dotColor: string;
  }
> = {
  aprobado: {
    label: "Aprobado",
    text: "text-amber-500 dark:text-amber-400",
    bg: "border-amber-300/50 dark:border-amber-700/40",
    leftBorder: "",
    dotColor: "bg-amber-400",
  },
  coincide: {
    label: "Coincide",
    text: "text-[#2FAF8F]",
    bg: "border-[#2FAF8F]/25",
    leftBorder: "",
    dotColor: "bg-[#2FAF8F]",
  },
  incompleto: {
    label: "Incompleto",
    text: "text-rose-500 dark:text-rose-400",
    bg: "border-rose-300/50 dark:border-rose-700/40",
    leftBorder: "border-l-[3px] border-l-rose-400 dark:border-l-rose-600",
    dotColor: "bg-rose-400",
  },
};

// ─── ÍCONOS ───────────────────────────────────────────────────────────────────

function IcoVerify() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IcoWarn() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="9" x2="12" y2="13" />
      <circle cx="12" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}
function IcoDoc() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}
function IcoHash() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export default function TwinsFeedWidget({
  auditorias,
  completitud,
  onSelect,
}: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const incompletas = auditorias.filter(
    (a) => a.estado === "incompleto",
  ).length;

  // FIX: empty state cuando no hay auditorías
  if (auditorias.length === 0) {
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
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span className="text-[12px] text-stone-400 dark:text-stone-500">
          Sin auditorías registradas
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[13.5px] font-semibold text-stone-800 dark:text-stone-100">
          Auditorías y Evidencias
        </p>
        {incompletas > 0 && (
          <span className="flex items-center gap-1.5 text-[10.5px] font-semibold text-rose-500 dark:text-rose-400 border border-rose-300/50 dark:border-rose-700/40 px-2 py-0.5 rounded-[6px]">
            <IcoWarn />
            {incompletas} incompleta{incompletas > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Completitud documental */}
      <div className="bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[12px] px-4 py-3.5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11.5px] font-semibold text-stone-600 dark:text-stone-300">
            Completitud documental
          </p>
          <span
            className={`font-mono text-[13px] font-bold ${completitud >= 90 ? "text-[#2FAF8F]" : completitud >= 70 ? "text-amber-500" : "text-rose-500"}`}
          >
            {completitud}%
          </span>
        </div>

        {/* FIX: barra usa el prop `completitud` real en lugar de contar tarjetas */}
        <div className="relative h-2.5 bg-stone-100 dark:bg-stone-800/50 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              completitud >= 90
                ? "bg-[#2FAF8F]"
                : completitud >= 70
                  ? "bg-amber-400"
                  : "bg-rose-400"
            }`}
            style={{ width: `${completitud}%` }}
          />
        </div>

        {/* Leyenda conteo por estado */}
        <div className="flex items-center gap-4 mt-2">
          {[
            {
              color: "bg-amber-400",
              label: "Aprobado",
              count: auditorias.filter((a) => a.estado === "aprobado").length,
            },
            {
              color: "bg-[#2FAF8F]",
              label: "Coincide",
              count: auditorias.filter((a) => a.estado === "coincide").length,
            },
            {
              color: "bg-rose-400",
              label: "Incompleto",
              count: auditorias.filter((a) => a.estado === "incompleto").length,
            },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-sm ${l.color}`} />
              <span className="text-[10px] text-stone-400 dark:text-stone-500">
                {l.label} ({l.count})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Lista auditorías */}
      <div className="flex flex-col gap-2.5">
        {auditorias.map((a) => {
          const cfg = ESTADO_CFG[a.estado];
          const isOpen = expanded === a.id;

          return (
            <div
              key={a.id}
              className={`bg-white dark:bg-[#1c1917] rounded-[12px] overflow-hidden border cursor-pointer transition-all hover:shadow-sm
                ${
                  a.estado === "incompleto"
                    ? `${cfg.leftBorder} border border-rose-200/70 dark:border-rose-800/40`
                    : "border border-stone-200/60 dark:border-stone-800/50"
                }`}
              onClick={() => {
                setExpanded(isOpen ? null : a.id);
                onSelect?.(a);
              }}
            >
              {/* Fila principal */}
              <div className="flex items-start gap-3 px-4 py-3.5">
                <div className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0 mt-0.5 text-stone-400 dark:text-stone-500">
                  <IcoDoc />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold text-stone-800 dark:text-stone-100 leading-tight">
                    {a.nombre}
                  </p>
                  <p className="text-[11.5px] text-stone-400 dark:text-stone-500 mt-0.5">
                    {a.sub}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="font-mono text-[10px] text-stone-400 dark:text-stone-500">
                    {a.fecha}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-[5px] border ${cfg.bg} ${cfg.text}`}
                  >
                    {cfg.label}
                  </span>
                  <svg
                    className={`w-3 h-3 text-stone-300 dark:text-stone-600 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              {/* Pills expandidas */}
              {isOpen && (
                <>
                  <div
                    className={`flex flex-wrap gap-1.5 px-4 py-2.5 border-t ${
                      a.estado === "incompleto"
                        ? "bg-rose-50/40 dark:bg-rose-950/10 border-rose-100 dark:border-rose-800/20"
                        : "bg-stone-50/60 dark:bg-stone-800/20 border-stone-100 dark:border-stone-800/40"
                    }`}
                  >
                    {a.pills.map((p, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-[7px] border ${
                          p.ok
                            ? "bg-white dark:bg-[#1c1917] border-stone-200/70 dark:border-stone-700/50 text-stone-600 dark:text-stone-300"
                            : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/30 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        <span
                          className={`shrink-0 ${p.ok ? "text-[#2FAF8F]" : "text-rose-400"}`}
                        >
                          {p.ok ? <IcoVerify /> : <IcoWarn />}
                        </span>
                        {p.label}
                      </div>
                    ))}
                  </div>

                  {/* Hash IPFS */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-stone-50 dark:bg-[#141210] border-t border-stone-100 dark:border-stone-800/40">
                    <span
                      className={`shrink-0 ${a.hashOk ? "text-[#2FAF8F]" : "text-stone-300 dark:text-stone-600"}`}
                    >
                      <IcoHash />
                    </span>
                    <span
                      className={`font-mono text-[9.5px] truncate ${
                        a.hashOk
                          ? "text-stone-400 dark:text-stone-500"
                          : "text-stone-300 dark:text-stone-600 italic"
                      }`}
                    >
                      {a.hash}
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
