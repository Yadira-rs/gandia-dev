/**
 * CertificationPerfilesWidget
 * v2 — anillo de score, KPIs con proporción, filas expandidas, barras de progreso visibles.
 */
export type CertEstado = "listo" | "casi" | "bloqueado";

export interface CertAnimalItem {
  arete: string;
  nombre?: string;
  lote: string;
  corral?: string;
  estado: CertEstado;
  score: number;
  tipoCert: string;
  diasVence?: number;
  bloqueantes?: number;
  pendientes?: number;
}

interface Props {
  animales: CertAnimalItem[];
  selected?: CertAnimalItem | null;
  onSelect: (item: CertAnimalItem) => void;
}

// ─── Config de estado ──────────────────────────────────────────────────────────

const EST: Record<
  CertEstado,
  { label: string; color: string; bg: string; text: string }
> = {
  listo: { label: "Listo", color: "#2FAF8F", bg: "#2FAF8F18", text: "#1a8c6e" },
  casi: { label: "Casi", color: "#d97706", bg: "#fef3c7", text: "#92400e" },
  bloqueado: {
    label: "Bloqueado",
    color: "#e11d48",
    bg: "#ffe4e6",
    text: "#9f1239",
  },
};

const PROG_COLOR = (score: number) =>
  score >= 80 ? "#2FAF8F" : score >= 50 ? "#d97706" : "#e11d48";

// ─── Score ring SVG ───────────────────────────────────────────────────────────

const CIRCUMFERENCE = 2 * Math.PI * 18; // r=18 → 113.1

function ScoreRing({ score, color }: { score: number; color: string }) {
  const offset = CIRCUMFERENCE * (1 - score / 100);
  return (
    <svg width="44" height="44" viewBox="0 0 44 44">
      <circle
        cx="22"
        cy="22"
        r="18"
        fill="none"
        stroke="currentColor"
        className="text-stone-100 dark:text-stone-800"
        strokeWidth="4"
      />
      <circle
        cx="22"
        cy="22"
        r="18"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text
        x="22"
        y="26"
        textAnchor="middle"
        fontSize="11"
        fontWeight="500"
        fill={color}
        fontFamily="sans-serif"
      >
        {score}
      </text>
    </svg>
  );
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function CertificationPerfilesWidget({
  animales,
  selected,
  onSelect,
}: Props) {
  const listos = animales.filter((a) => a.estado === "listo").length;
  const casi = animales.filter((a) => a.estado === "casi").length;
  const bloq = animales.filter((a) => a.estado === "bloqueado").length;
  const total = animales.length;

  const kpis = [
    { n: listos, label: "Listos", color: "#2FAF8F" },
    { n: casi, label: "Casi listos", color: "#d97706" },
    { n: bloq, label: "Bloqueados", color: "#e11d48" },
  ];

  const renderAlerta = (item: CertAnimalItem) => {
    if ((item.bloqueantes ?? 0) > 0) {
      return (
        <span
          className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full animate-pulse"
          style={{ background: "#ffe4e6", color: "#9f1239" }}
        >
          {item.bloqueantes} bloq.
        </span>
      );
    }
    if (item.diasVence !== undefined) {
      if (item.diasVence < 0)
        return (
          <span
            className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full animate-pulse"
            style={{ background: "#ffe4e6", color: "#9f1239" }}
          >
            Vencido
          </span>
        );
      if (item.diasVence <= 30)
        return (
          <span
            className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full animate-pulse"
            style={{ background: "#fef3c7", color: "#92400e" }}
          >
            {item.diasVence} días
          </span>
        );
      return (
        <span className="text-[10px] text-stone-400 dark:text-stone-500">
          {item.diasVence} días
        </span>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col">
      {/* ── KPIs ── */}
      <div className="grid grid-cols-3 gap-2.5 mb-6">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="relative bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[12px] px-4 pt-5 pb-3.5 overflow-hidden"
          >
            {/* Acento top */}
            <div
              className="absolute top-0 left-0 right-0 h-[3px]"
              style={{ background: k.color }}
            />
            <p
              className="text-[36px] font-medium leading-none tabular-nums mb-1.5"
              style={{ color: k.color }}
            >
              {k.n}
            </p>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 mb-2.5">
              {k.label}
            </p>
            {/* Barra de proporción */}
            <div className="h-[4px] bg-stone-100 dark:bg-stone-800/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${total > 0 ? (k.n / total) * 100 : 0}%`,
                  background: k.color,
                }}
              />
            </div>
            <p className="text-[10px] text-stone-300 dark:text-stone-600 mt-1.5">
              {total > 0 ? Math.round((k.n / total) * 100) : 0}% del total
            </p>
          </div>
        ))}
      </div>

      {/* ── Header lista ── */}
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <p className="text-[10.5px] text-stone-400 dark:text-stone-500 tracking-[0.04em]">
          {total} animal{total !== 1 ? "es" : ""} · expedientes
        </p>
      </div>

      {/* ── Lista ── */}
      <div className="flex flex-col gap-2">
        {animales.map((item) => {
          const est = EST[item.estado];
          const progColor = PROG_COLOR(item.score);
          const isActive = selected?.arete === item.arete;

          return (
            <button
              key={item.arete}
              type="button"
              onClick={() => onSelect(item)}
              className={`w-full text-left grid gap-3 p-4 rounded-[12px] border cursor-pointer transition-all
                ${
                  isActive
                    ? "border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-[#1a1917]"
                    : "border-stone-200/60 dark:border-stone-800/50 bg-white dark:bg-[#1c1917] hover:border-stone-300 dark:hover:border-stone-700 hover:bg-stone-50/80 dark:hover:bg-[#1a1917]/80"
                }`}
              style={{
                gridTemplateColumns: "64px 1fr auto 20px",
                alignItems: "center",
              }}
            >
              {/* Score ring */}
              <div className="flex flex-col items-center gap-1">
                <ScoreRing score={item.score} color={progColor} />
                <span className="text-[10px] text-stone-400 dark:text-stone-500">
                  score
                </span>
              </div>

              {/* Info */}
              <div className="min-w-0">
                <p className="font-mono text-[13px] font-semibold text-stone-800 dark:text-stone-100 mb-0.5">
                  {item.arete}
                </p>
                {item.nombre ? (
                  <p className="text-[12px] text-stone-500 dark:text-stone-400 mb-1">
                    {item.nombre}
                  </p>
                ) : (
                  <p className="text-[12px] text-stone-300 dark:text-stone-600 italic mb-1">
                    Sin nombre
                  </p>
                )}
                <p className="text-[11px] text-stone-400 dark:text-stone-500 mb-2.5">
                  {item.tipoCert}
                  {(item.lote || item.corral) && (
                    <span className="font-mono text-[10px] text-stone-300 dark:text-stone-600 bg-stone-100 dark:bg-stone-800/50 rounded px-1.5 py-0.5 ml-1.5">
                      {[item.lote, item.corral].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </p>
                {/* Barra de progreso */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-stone-400 dark:text-stone-500">
                      Expediente
                    </span>
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: progColor }}
                    >
                      {item.score}%
                    </span>
                  </div>
                  <div className="h-[6px] bg-stone-100 dark:bg-stone-800/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${item.score}%`, background: progColor }}
                    />
                  </div>
                </div>
              </div>

              {/* Estado + alerta */}
              <div className="flex flex-col items-end gap-1.5">
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full"
                  style={{ background: est.bg, color: est.text }}
                >
                  <span
                    className="w-[5px] h-[5px] rounded-full shrink-0"
                    style={{ background: est.color }}
                  />
                  {est.label}
                </span>
                {renderAlerta(item)}
              </div>

              {/* Chevron */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="text-stone-300 dark:text-stone-600 shrink-0"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}
