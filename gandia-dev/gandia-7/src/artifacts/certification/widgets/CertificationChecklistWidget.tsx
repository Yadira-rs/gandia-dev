/**
 * CertificationChecklistWidget
 * v2 — hero ligero, KPIs tintados, cabeceras uniformes, filas con aire, botones contextuales.
 */
export type CatRequisito = "identidad" | "sanitario" | "documental" | "legal";

export interface Requisito {
  id: string;
  categoria: CatRequisito;
  label: string;
  desc: string;
  estado: "ok" | "pendiente" | "faltante" | "bloqueante";
  fuente?: string;
  accion?: string;
}

export interface DatosChecklist {
  tipoCert: string;
  autoridad: string;
  animal: string;
  arete: string;
  requisitos: Requisito[];
}

interface Props {
  datos: DatosChecklist;
  onAccion?: (reqId: string) => void;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CAT_CONFIG: Record<CatRequisito, { label: string; icon: JSX.Element }> = {
  identidad: {
    label: "Identidad",
    icon: (
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
  sanitario: {
    label: "Sanitario",
    icon: (
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  documental: {
    label: "Documental",
    icon: (
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  legal: {
    label: "Legal / Oficial",
    icon: (
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
};

const CIRCUMFERENCE = 2 * Math.PI * 22;

function ScoreRing({ pct, color }: { pct: number; color: string }) {
  const offset = CIRCUMFERENCE * (1 - pct / 100);
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle
        cx="28"
        cy="28"
        r="22"
        fill="none"
        stroke="currentColor"
        className="text-stone-100 dark:text-stone-800"
        strokeWidth="5"
      />
      <circle
        cx="28"
        cy="28"
        r="22"
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
        style={{ transition: "stroke-dashoffset 0.7s ease" }}
      />
      <text
        x="28"
        y="32"
        textAnchor="middle"
        fontSize="12"
        fontWeight="500"
        fill={color}
        fontFamily="sans-serif"
      >
        {pct}%
      </text>
    </svg>
  );
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function CertificationChecklistWidget({
  datos,
  onAccion,
}: Props) {
  const total = datos.requisitos.length;
  const okCount = datos.requisitos.filter((r) => r.estado === "ok").length;
  const pendCount = datos.requisitos.filter(
    (r) => r.estado === "pendiente" || r.estado === "faltante",
  ).length;
  const bloqCount = datos.requisitos.filter(
    (r) => r.estado === "bloqueante",
  ).length;
  const pct = total > 0 ? Math.round((okCount / total) * 100) : 0;
  const pctColor = pct === 100 ? "#2FAF8F" : pct >= 70 ? "#d97706" : "#e11d48";

  const estadoLabel =
    pct === 100
      ? "Listo para certificar"
      : bloqCount > 0
        ? `${bloqCount} bloqueante${bloqCount > 1 ? "s" : ""}`
        : `${pendCount} pendiente${pendCount > 1 ? "s" : ""}`;
  const estadoBg =
    pct === 100 ? "#2FAF8F18" : bloqCount > 0 ? "#ffe4e6" : "#fef3c7";
  const estadoText =
    pct === 100 ? "#1a8c6e" : bloqCount > 0 ? "#9f1239" : "#92400e";
  const estadoDot =
    pct === 100 ? "#2FAF8F" : bloqCount > 0 ? "#e11d48" : "#d97706";

  const categorias = (
    ["identidad", "sanitario", "documental", "legal"] as CatRequisito[]
  ).filter((cat) => datos.requisitos.some((r) => r.categoria === cat));

  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <div className="bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[16px] overflow-hidden mb-3.5">
        <div className="flex items-stretch">
          <div className="flex-1 px-5 pt-[18px] pb-4">
            <p className="text-[10px] text-stone-400 dark:text-stone-500 tracking-[0.07em] uppercase mb-2.5">
              {datos.tipoCert} · {datos.autoridad}
            </p>
            <div className="flex items-flex-end gap-2 mb-2">
              <span
                className="text-[56px] font-medium leading-none tabular-nums"
                style={{ color: pctColor }}
              >
                {okCount}
              </span>
              <span className="text-[16px] text-stone-300 dark:text-stone-600 self-end mb-2">
                / {total}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 mb-3">
              requisitos completados
            </p>
            <div
              className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
              style={{ background: estadoBg, color: estadoText }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: estadoDot }}
              />
              {estadoLabel}
            </div>
            <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800/40">
              <p className="text-[12.5px] font-medium text-stone-800 dark:text-stone-100">
                {datos.animal}{" "}
                <span className="font-mono font-normal text-stone-400 dark:text-stone-500 text-[11.5px]">
                  {datos.arete}
                </span>
              </p>
            </div>
          </div>
          <div className="w-[86px] flex flex-col items-center justify-center gap-1.5 px-4 border-l border-stone-100 dark:border-stone-800/40 bg-stone-50/70 dark:bg-stone-900/30">
            <ScoreRing pct={pct} color={pctColor} />
            <span className="text-[10px] text-stone-400 dark:text-stone-500">
              avance
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 bg-stone-50/70 dark:bg-stone-900/30 border-t border-stone-100 dark:border-stone-800/40">
          <span className="text-[11px] text-stone-400 dark:text-stone-500 shrink-0">
            Progreso
          </span>
          <div className="flex-1 h-[6px] bg-stone-100 dark:bg-stone-800/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: pctColor }}
            />
          </div>
          <span
            className="text-[11px] font-medium shrink-0"
            style={{ color: pctColor }}
          >
            {pct}%
          </span>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          {
            n: okCount,
            label: "Completados",
            color: "#2FAF8F",
            bg: "#f0fdf4",
            text: "#166534",
            track: "#bbf7d0",
            pct: total > 0 ? (okCount / total) * 100 : 0,
          },
          {
            n: pendCount,
            label: "Pendientes",
            color: "#d97706",
            bg: "#fffbeb",
            text: "#92400e",
            track: "#fde68a",
            pct: total > 0 ? (pendCount / total) * 100 : 0,
          },
          {
            n: bloqCount,
            label: "Bloqueantes",
            color: "#e11d48",
            bg: "#fff5f5",
            text: "#9f1239",
            track: "#fecdd3",
            pct: total > 0 ? (bloqCount / total) * 100 : 0,
          },
        ].map((k) => (
          <div
            key={k.label}
            className="relative rounded-[12px] px-3.5 pt-5 pb-3 overflow-hidden"
            style={{ background: k.bg }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-[3px]"
              style={{ background: k.color }}
            />
            <p
              className="text-[28px] font-medium leading-none tabular-nums mb-1"
              style={{ color: k.text }}
            >
              {k.n}
            </p>
            <p className="text-[10.5px] mb-2" style={{ color: k.text }}>
              {k.label}
            </p>
            <div
              className="h-[3px] rounded-full overflow-hidden"
              style={{ background: k.track }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${k.pct}%`, background: k.color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── Requisitos por categoría ── */}
      <p className="text-[10px] text-stone-400 dark:text-stone-500 tracking-[0.07em] uppercase mb-2.5 px-0.5">
        Requisitos por categoría
      </p>

      <div className="flex flex-col gap-3">
        {categorias.map((cat) => {
          const reqs = datos.requisitos.filter((r) => r.categoria === cat);
          const catOk = reqs.every((r) => r.estado === "ok");
          const catBloq = reqs.filter((r) => r.estado === "bloqueante").length;
          const catPend = reqs.filter((r) => r.estado !== "ok").length;
          const cfg = CAT_CONFIG[cat];

          const catColor = catOk
            ? "#2FAF8F"
            : catBloq > 0
              ? "#e11d48"
              : "#d97706";
          const catBg = catOk
            ? "#2FAF8F18"
            : catBloq > 0
              ? "#ffe4e6"
              : "#fef3c7";
          const catText = catOk
            ? "#1a8c6e"
            : catBloq > 0
              ? "#9f1239"
              : "#92400e";
          const catStatLabel = catOk
            ? `${reqs.length} / ${reqs.length} completos`
            : catBloq > 0
              ? `${catBloq} bloqueante${catBloq > 1 ? "s" : ""}`
              : `${catPend} pendiente${catPend > 1 ? "s" : ""}`;

          return (
            <div
              key={cat}
              className="border border-stone-200/60 dark:border-stone-800/50 rounded-[12px] overflow-hidden"
            >
              {/* Cabecera — fondo neutro uniforme */}
              <div className="flex items-center gap-2.5 px-4 py-3 bg-stone-50/70 dark:bg-stone-900/30">
                <div
                  className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0"
                  style={{ background: catBg, color: catColor }}
                >
                  {cfg.icon}
                </div>
                <span className="text-[12px] font-medium text-stone-700 dark:text-stone-200 flex-1">
                  {cfg.label}
                </span>
                <span
                  className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2.5 py-1 rounded-full"
                  style={{ background: catBg, color: catText }}
                >
                  <span
                    className="w-[5px] h-[5px] rounded-full shrink-0"
                    style={{ background: catColor }}
                  />
                  {catStatLabel}
                </span>
              </div>

              {/* Filas */}
              <div className="divide-y divide-stone-100 dark:divide-stone-800/40 bg-white dark:bg-[#1c1917]">
                {reqs.map((req) => {
                  const isOk = req.estado === "ok";
                  const isBloq = req.estado === "bloqueante";
                  const icoBg = isOk
                    ? "#2FAF8F18"
                    : isBloq
                      ? "#ffe4e6"
                      : "#fef3c7";
                  const icoColor = isOk
                    ? "#2FAF8F"
                    : isBloq
                      ? "#e11d48"
                      : "#d97706";

                  return (
                    <div
                      key={req.id}
                      className="flex items-start gap-3 px-4 py-3.5"
                    >
                      <div
                        className="w-[26px] h-[26px] rounded-[8px] flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: icoBg }}
                      >
                        {isOk ? (
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={icoColor}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : isBloq ? (
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={icoColor}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        ) : (
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={icoColor}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-[12.5px] leading-snug mb-1 ${isOk ? "text-stone-500 dark:text-stone-400" : "font-medium"}`}
                          style={{ color: isOk ? undefined : icoColor }}
                        >
                          {req.label}
                        </p>
                        <p className="text-[11px] text-stone-400 dark:text-stone-500 leading-snug">
                          {req.desc}
                        </p>
                        {req.fuente && (
                          <p className="font-mono text-[10px] text-stone-300 dark:text-stone-600 mt-1.5">
                            ← {req.fuente}
                          </p>
                        )}
                      </div>
                      {req.accion && !isOk && onAccion && (
                        <button
                          type="button"
                          onClick={() => onAccion(req.id)}
                          className="shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-[8px] border bg-transparent cursor-pointer transition-all mt-0.5"
                          style={{
                            color: isBloq ? "#2FAF8F" : "#d97706",
                            borderColor: isBloq ? "#2FAF8F55" : "#d9770655",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = isBloq
                              ? "#2FAF8F12"
                              : "#d9770612";
                            e.currentTarget.style.borderColor = isBloq
                              ? "#2FAF8F"
                              : "#d97706";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.borderColor = isBloq
                              ? "#2FAF8F55"
                              : "#d9770655";
                          }}
                        >
                          {req.accion} →
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="pt-4 mt-1 border-t border-stone-100 dark:border-stone-800/40">
        <p className="text-[11px] text-stone-300 dark:text-stone-600 italic px-0.5">
          Certificación emitida por {datos.autoridad} · Gandia prepara el
          expediente
        </p>
      </div>
    </div>
  );
}
