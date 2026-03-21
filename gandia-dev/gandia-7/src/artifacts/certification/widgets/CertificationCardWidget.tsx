/**
 * CertificationCardWidget
 * v3 — barra 5px, umbrales badge, separadores grid, botones claros, type="button"
 */
export type EstadoCert =
  | "vigente"
  | "por_vencer"
  | "vencido"
  | "en_proceso"
  | "rechazado";

export interface DatosCertCard {
  id: string;
  tipo: string;
  autoridad: string;
  animal: string;
  arete: string;
  lote?: string;
  corral?: string;
  estado: EstadoCert;
  folio?: string;
  fechaEmision?: string;
  fechaVence?: string;
  diasParaVencer?: number;
  bloqueantes?: number;
  completitud: number;
  expedidor?: string;
}

interface Props {
  data: DatosCertCard;
  onExpand?: () => void;
  onVerCheck?: () => void;
}

// ─── Config de estado ──────────────────────────────────────────────────────────

const EST: Record<
  EstadoCert,
  { label: string; color: string; bg: string; text: string }
> = {
  vigente: {
    label: "Vigente",
    color: "#2FAF8F",
    bg: "#2FAF8F18",
    text: "#1a8c6e",
  },
  por_vencer: {
    label: "Por vencer",
    color: "#d97706",
    bg: "#fef3c7",
    text: "#92400e",
  },
  vencido: {
    label: "Vencido",
    color: "#e11d48",
    bg: "#ffe4e6",
    text: "#9f1239",
  },
  en_proceso: {
    label: "En proceso",
    color: "#3b82f6",
    bg: "#eff6ff",
    text: "#1e40af",
  },
  rechazado: {
    label: "Rechazado",
    color: "#78716c",
    bg: "#f5f5f4",
    text: "#57534e",
  },
};

const PROGRESS_COLOR = (pct: number) =>
  pct >= 80 ? "#2FAF8F" : pct >= 50 ? "#d97706" : "#e11d48";

// ─── Componente ───────────────────────────────────────────────────────────────

export default function CertificationCardWidget({
  data,
  onExpand,
  onVerCheck,
}: Props) {
  const est = EST[data.estado];
  const progColor = PROGRESS_COLOR(data.completitud);

  const renderBadge = () => {
    // Bloqueantes — rojo con pulso
    if ((data.bloqueantes ?? 0) > 0) {
      return (
        <span
          style={{ background: "#ffe4e6", color: "#9f1239" }}
          className="inline-flex items-center text-[11px] font-medium px-2.5 py-0.5 rounded-full animate-pulse"
        >
          {data.bloqueantes} bloqueante{(data.bloqueantes ?? 0) > 1 ? "s" : ""}
        </span>
      );
    }

    if (data.diasParaVencer !== undefined) {
      // Vencido
      if (data.diasParaVencer < 0) {
        return (
          <span
            style={{ background: "#ffe4e6", color: "#9f1239" }}
            className="inline-flex items-center text-[11px] font-medium px-2.5 py-0.5 rounded-full animate-pulse"
          >
            Vencido
          </span>
        );
      }
      // Urgente ≤30 días — ámbar con pulso
      if (data.diasParaVencer <= 30) {
        return (
          <span
            style={{ background: "#fef3c7", color: "#92400e" }}
            className="inline-flex items-center text-[11px] font-medium px-2.5 py-0.5 rounded-full animate-pulse"
          >
            {data.diasParaVencer} día{data.diasParaVencer !== 1 ? "s" : ""}
          </span>
        );
      }
      // Holgado >30 días — verde sin pulso
      return (
        <span
          style={{ background: "#f0fdf4", color: "#166534" }}
          className="inline-flex items-center text-[11px] font-medium px-2.5 py-0.5 rounded-full"
        >
          {data.diasParaVencer} días
        </span>
      );
    }

    return null;
  };

  return (
    <div className="border border-stone-200/60 dark:border-stone-800/50 rounded-[14px] overflow-hidden bg-white dark:bg-[#1c1917]">
      {/* Barra de estado — 5px */}
      <div className="h-[5px] w-full" style={{ background: est.color }} />

      {/* Header — tipo + estado */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-stone-800 dark:text-stone-100 leading-snug">
            {data.tipo}
          </p>
          <p className="text-[11.5px] text-stone-400 dark:text-stone-500 mt-0.5">
            {data.autoridad}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span
            className="inline-flex items-center gap-[5px] text-[12px] font-medium px-2.5 py-1 rounded-full"
            style={{ background: est.bg, color: est.text }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: est.color }}
            />
            {est.label}
          </span>
          {data.folio && (
            <p className="font-mono text-[10px] text-stone-300 dark:text-stone-600 mt-1.5">
              {data.folio}
            </p>
          )}
        </div>
      </div>

      {/* Divisor */}
      <div className="h-px bg-stone-100 dark:bg-stone-800/40 mx-4" />

      {/* Animal */}
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800/50 flex items-center justify-center shrink-0">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="text-stone-400 dark:text-stone-500"
          >
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold text-stone-800 dark:text-stone-100">
            {data.animal}{" "}
            <span className="font-mono font-normal text-stone-400 dark:text-stone-500 text-[12px]">
              {data.arete}
            </span>
          </p>
          {(data.lote || data.corral) && (
            <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
              {[data.lote, data.corral].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <div className="shrink-0">{renderBadge()}</div>
      </div>

      {/* Grid de datos con separadores verticales */}
      <div className="grid grid-cols-3 border-t border-b border-stone-100 dark:border-stone-800/40 bg-stone-50/70 dark:bg-stone-900/30">
        {[
          { label: "Emisión", value: data.fechaEmision, color: undefined },
          {
            label: "Vencimiento",
            value: data.fechaVence,
            color:
              data.estado === "vencido" || data.estado === "por_vencer"
                ? est.color
                : undefined,
          },
          {
            label: "Expedidor",
            value: data.expedidor,
            color: undefined,
            small: true,
          },
        ].map((col, i) =>
          col.value ? (
            <div
              key={col.label}
              className={`px-4 py-3 ${i !== 2 ? "border-r border-stone-100 dark:border-stone-800/40" : ""}`}
            >
              <p className="text-[10.5px] text-stone-400 dark:text-stone-500 mb-0.5">
                {col.label}
              </p>
              <p
                className={`font-medium text-stone-700 dark:text-stone-300 ${col.small ? "text-[12px]" : "text-[12.5px]"}`}
                style={{ color: col.color }}
              >
                {col.value}
              </p>
            </div>
          ) : null,
        )}
      </div>

      {/* Barra de progreso */}
      <div className="px-4 py-3.5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] text-stone-400 dark:text-stone-500">
            Completitud del expediente
          </p>
          <p className="text-[13px] font-semibold" style={{ color: progColor }}>
            {data.completitud}%
          </p>
        </div>
        <div className="h-[5px] bg-stone-100 dark:bg-stone-800/50 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${data.completitud}%`, background: progColor }}
          />
        </div>
      </div>

      {/* Acciones */}
      {(onVerCheck || onExpand) && (
        <div className="px-4 pb-4 pt-1 flex items-center justify-end gap-2 border-t border-stone-100 dark:border-stone-800/40">
          {onVerCheck && (
            <button
              type="button"
              onClick={onVerCheck}
              className="text-[12px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 bg-transparent border border-stone-200/70 dark:border-stone-700/60 rounded-[8px] px-3 py-1.5 cursor-pointer transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/40"
            >
              Checklist
            </button>
          )}
          {onExpand && (
            <button
              type="button"
              onClick={onExpand}
              className="text-[12px] font-semibold rounded-[8px] px-3 py-1.5 cursor-pointer transition-colors border"
              style={{
                color: "#2FAF8F",
                borderColor: "#2FAF8F44",
                background: "transparent",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#2FAF8F12")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              Ver expediente →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
