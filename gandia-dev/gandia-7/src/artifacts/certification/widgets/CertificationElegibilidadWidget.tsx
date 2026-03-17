/**
 * CertificationElegibilidadWidget
 * v2 — hero ligero, alertas por fila, dominios con barra, chips elegantes, acciones refinadas.
 */
export type EstadoElegibilidad = "listo" | "casi" | "bloqueado";

export interface DominioCheck {
  dominio: "pasaporte" | "gemelo" | "monitoreo" | "sanidad";
  label: string;
  ok: boolean;
  items: { texto: string; ok: boolean; critico?: boolean }[];
}

export interface DatosElegibilidad {
  animal: string;
  arete: string;
  lote: string;
  corral?: string;
  tipoCert: string;
  estado: EstadoElegibilidad;
  score: number;
  dominios: DominioCheck[];
  bloqueantes: string[];
  pendientes: string[];
  fechaCorte?: string;
}

interface Props {
  datos: DatosElegibilidad;
  onExpedir?: () => void;
  onVerDetalle?: () => void;
}

// ─── Config de estado ──────────────────────────────────────────────────────────

const EST: Record<
  EstadoElegibilidad,
  { label: string; color: string; bg: string; text: string }
> = {
  listo: {
    label: "Listo para certificar",
    color: "#2FAF8F",
    bg: "#2FAF8F18",
    text: "#1a8c6e",
  },
  casi: {
    label: "Casi listo",
    color: "#d97706",
    bg: "#fef3c7",
    text: "#92400e",
  },
  bloqueado: {
    label: "Bloqueado",
    color: "#e11d48",
    bg: "#ffe4e6",
    text: "#9f1239",
  },
};

const CIRCUMFERENCE = 2 * Math.PI * 24; // r=24 → 150.8

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, color }: { score: number; color: string }) {
  const offset = CIRCUMFERENCE * (1 - score / 100);
  return (
    <svg width="60" height="60" viewBox="0 0 60 60">
      <circle
        cx="30"
        cy="30"
        r="24"
        fill="none"
        stroke="currentColor"
        className="text-stone-100 dark:text-stone-800"
        strokeWidth="5"
      />
      <circle
        cx="30"
        cy="30"
        r="24"
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 30 30)"
        style={{ transition: "stroke-dashoffset 0.7s ease" }}
      />
      <text
        x="30"
        y="34"
        textAnchor="middle"
        fontSize="13"
        fontWeight="500"
        fill={color}
        fontFamily="sans-serif"
      >
        {score}%
      </text>
    </svg>
  );
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function CertificationElegibilidadWidget({
  datos,
  onExpedir,
  onVerDetalle,
}: Props) {
  const est = EST[datos.estado];

  return (
    <div className="flex flex-col gap-0">
      {/* ── Hero ── */}
      <div className="bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[16px] overflow-hidden mb-3.5">
        <div className="flex items-stretch">
          {/* Izquierda — número + estado + animal */}
          <div className="flex-1 px-5 pt-[18px] pb-4">
            <p className="text-[10px] text-stone-400 dark:text-stone-500 tracking-[0.07em] uppercase mb-3">
              {datos.tipoCert}
            </p>
            <div className="flex items-flex-end gap-1.5 mb-2">
              <span
                className="text-[60px] font-medium leading-none tabular-nums"
                style={{ color: est.color }}
              >
                {datos.score}
              </span>
              <span className="text-[16px] text-stone-300 dark:text-stone-600 self-end mb-2">
                / 100
              </span>
            </div>
            <div
              className="inline-flex items-center gap-1.5 text-[11.5px] font-medium px-2.5 py-1 rounded-full mb-3.5"
              style={{ background: est.bg, color: est.text }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: est.color }}
              />
              {est.label}
            </div>
            <div className="pt-3.5 border-t border-stone-100 dark:border-stone-800/40">
              <p className="text-[13px] font-medium text-stone-800 dark:text-stone-100">
                {datos.animal}{" "}
                <span className="font-mono font-normal text-stone-400 dark:text-stone-500 text-[12px]">
                  {datos.arete}
                </span>
              </p>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                {[datos.lote, datos.corral].filter(Boolean).join(" · ")}
              </p>
              {datos.fechaCorte && (
                <p className="text-[11px] text-amber-600 dark:text-amber-500 mt-1">
                  Fecha límite: {datos.fechaCorte}
                </p>
              )}
            </div>
          </div>

          {/* Derecha — anillo */}
          <div className="w-[90px] flex flex-col items-center justify-center gap-2 px-4 border-l border-stone-100 dark:border-stone-800/40 bg-stone-50/70 dark:bg-stone-900/30">
            <ScoreRing score={datos.score} color={est.color} />
            <span className="text-[10px] text-stone-400 dark:text-stone-500">
              elegibilidad
            </span>
          </div>
        </div>

        {/* Barra de progreso inferior */}
        <div className="flex items-center gap-3 px-5 py-3 bg-stone-50/70 dark:bg-stone-900/30 border-t border-stone-100 dark:border-stone-800/40">
          <span className="text-[11px] text-stone-400 dark:text-stone-500 shrink-0">
            Progreso
          </span>
          <div className="flex-1 h-[6px] bg-stone-100 dark:bg-stone-800/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${datos.score}%`, background: est.color }}
            />
          </div>
          <span
            className="text-[11px] font-medium shrink-0"
            style={{ color: est.color }}
          >
            {datos.score} pts
          </span>
        </div>
      </div>

      {/* ── Alertas ── */}
      {(datos.bloqueantes.length > 0 || datos.pendientes.length > 0) && (
        <div className="mb-3.5">
          <p className="text-[10px] text-stone-400 dark:text-stone-500 tracking-[0.07em] uppercase mb-2 px-0.5">
            Alertas
          </p>
          <div className="flex flex-col gap-1.5">
            {datos.bloqueantes.map((b, i) => (
              <div
                key={`bloq-${i}`}
                className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-[10px] border"
                style={{ borderColor: "#fca5a5", background: "#fff5f5" }}
              >
                <div
                  className="w-6 h-6 rounded-[6px] flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "#ffe4e6" }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#e11d48"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <span
                  className="text-[12px] leading-snug flex-1"
                  style={{ color: "#9f1239" }}
                >
                  {b}
                </span>
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 mt-0.5"
                  style={{ background: "#ffe4e6", color: "#e11d48" }}
                >
                  Crítico
                </span>
              </div>
            ))}

            {datos.pendientes.map((p, i) => (
              <div
                key={`pend-${i}`}
                className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-[10px] border"
                style={{ borderColor: "#fde68a", background: "#fffbeb" }}
              >
                <div
                  className="w-6 h-6 rounded-[6px] flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "#fef3c7" }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <span
                  className="text-[12px] leading-snug flex-1"
                  style={{ color: "#92400e" }}
                >
                  {p}
                </span>
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 mt-0.5"
                  style={{ background: "#fef3c7", color: "#d97706" }}
                >
                  Pendiente
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Dominios ── */}
      <div className="mb-3.5">
        <p className="text-[10px] text-stone-400 dark:text-stone-500 tracking-[0.07em] uppercase mb-2 px-0.5">
          Verificación por dominio
        </p>
        <div className="flex flex-col gap-2.5">
          {datos.dominios.map((d, i) => {
            const fail = d.items.filter((x) => !x.ok);
            const hasCritico = fail.some((x) => x.critico);
            const color = d.ok ? "#2FAF8F" : hasCritico ? "#e11d48" : "#d97706";
            const pct = Math.round(
              (d.items.filter((x) => x.ok).length / d.items.length) * 100,
            );

            return (
              <div
                key={i}
                className="bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[12px] overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center gap-2.5 px-4 py-3">
                  <span
                    className="w-[7px] h-[7px] rounded-full shrink-0"
                    style={{ background: color }}
                  />
                  <span className="text-[12.5px] font-medium text-stone-700 dark:text-stone-200 flex-1">
                    {d.label}
                  </span>
                  <span className="text-[11px] font-medium" style={{ color }}>
                    {d.items.filter((x) => x.ok).length} / {d.items.length}
                  </span>
                </div>

                {/* Mini barra de dominio */}
                <div
                  className="mx-4 mb-3 h-[2px] rounded-full overflow-hidden"
                  style={{ background: `${color}22` }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>

                {/* Chips */}
                <div className="px-4 pb-3.5 flex flex-wrap gap-[5px]">
                  {d.items.map((item, j) => (
                    <span
                      key={j}
                      className={`inline-flex items-center gap-1 text-[11px] px-[11px] py-[5px] rounded-full border ${
                        item.ok
                          ? "bg-stone-50 dark:bg-stone-800/30 border-stone-200/60 dark:border-stone-700/40 text-stone-500 dark:text-stone-400"
                          : item.critico
                            ? "font-medium border-[#fca5a5] text-[#9f1239]"
                            : "border-[#fde68a] text-[#92400e]"
                      }`}
                      style={
                        !item.ok
                          ? { background: item.critico ? "#fff5f5" : "#fffbeb" }
                          : undefined
                      }
                    >
                      <span
                        className="w-[5px] h-[5px] rounded-full shrink-0"
                        style={{
                          background: item.ok
                            ? "#2FAF8F"
                            : item.critico
                              ? "#e11d48"
                              : "#d97706",
                        }}
                      />
                      {item.texto}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Acciones ── */}
      <div className="flex gap-2 pt-1">
        {onVerDetalle && (
          <button
            type="button"
            onClick={onVerDetalle}
            className="flex-1 py-3 rounded-[11px] border border-stone-200/70 dark:border-stone-700/60 bg-transparent text-[12.5px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800/40 hover:border-stone-300 dark:hover:border-stone-600 cursor-pointer transition-all"
          >
            Ver checklist
          </button>
        )}
        {onExpedir && (
          <button
            type="button"
            onClick={onExpedir}
            disabled={datos.estado === "bloqueado"}
            className={`flex-1 py-3 rounded-[11px] border-0 text-[12.5px] font-medium cursor-pointer transition-colors ${
              datos.estado === "bloqueado"
                ? "bg-stone-100 dark:bg-stone-800/40 text-stone-300 dark:text-stone-600 cursor-not-allowed"
                : "text-white"
            }`}
            style={
              datos.estado !== "bloqueado"
                ? { background: "#2FAF8F" }
                : undefined
            }
            onMouseEnter={(e) => {
              if (datos.estado !== "bloqueado")
                e.currentTarget.style.background = "#27a07f";
            }}
            onMouseLeave={(e) => {
              if (datos.estado !== "bloqueado")
                e.currentTarget.style.background = "#2FAF8F";
            }}
          >
            Preparar expediente
          </button>
        )}
      </div>
    </div>
  );
}
