/**
 * TwinsAlimentacionWidget
 * ARCHIVO → src/artifacts/twins/widgets/TwinsAlimentacionWidget.tsx
 *
 * Consumo semanal (line chart SVG) + Conversión Alimenticia (gauge).
 * Sin emojis. Conectado a Supabase via useTwinsData.ts
 *
 * FIXES v4:
 * - Validación de formulario antes de submit: mínimo un campo requerido
 * - botón Guardar deshabilitado mientras campos vacíos (antes: falso positivo con 0 semanas)
 * - progPeso usa (pesoActual - pesoNacimiento) / (pesoMeta - pesoNacimiento) — consistente con Hero
 * - Toggle "Conversión CA" oculto si caActual = 0 (sin datos reales)
 * - DatosAlimentacion incluye pesoNacimiento para cálculo correcto de progreso
 */
import { useState } from "react";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface SemanaConsumo {
  fecha: string;
  forraje: number;
  concentrado: number;
  suplemento: number;
}

export interface DatosAlimentacion {
  semanas: SemanaConsumo[];
  caActual: number;
  caObjetivo: number;
  caIndustria: number;
  proyDias: number;
  proyFecha: string;
  pesoMeta: number;
  pesoActual: number;
  // FIX: agregado para cálculo consistente de progreso
  pesoNacimiento?: number;
}

interface Props {
  datos: DatosAlimentacion;
  siniiga?: string;
  onRefresh?: () => void;
}

type Vista = "consumo" | "conversion";

// ─── CHART SVG ────────────────────────────────────────────────────────────────

const CW = 340,
  CH = 100;
const PL = 30,
  PR = 12,
  PT = 10,
  PB = 22;
const DW = CW - PL - PR;
const DH = CH - PT - PB;
const V_MIN = 50,
  V_MAX = 100;

function gx(i: number, n: number) {
  return PL + (i / (n - 1)) * DW;
}
function gy(v: number) {
  return PT + (1 - (v - V_MIN) / (V_MAX - V_MIN)) * DH;
}
function line(pts: number[][]) {
  return pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
}
function area(pts: number[][]) {
  if (!pts.length) return "";
  return `${line(pts)} L${pts[pts.length - 1][0].toFixed(1)},${(PT + DH).toFixed(1)} L${pts[0][0].toFixed(1)},${(PT + DH).toFixed(1)} Z`;
}

function LineChart({ semanas }: { semanas: SemanaConsumo[] }) {
  if (!semanas.length)
    return (
      <div className="flex items-center justify-center py-8 text-[12px] text-stone-400 dark:text-stone-500">
        Sin registros de consumo aún
      </div>
    );
  const rev = [...semanas].reverse();
  const n = rev.length;
  const F = rev.map((s, i) => [gx(i, n), gy(s.forraje)]);
  const C = rev.map((s, i) => [gx(i, n), gy(s.concentrado)]);
  const S = rev.map((s, i) => [gx(i, n), gy(s.suplemento)]);
  const grids = [60, 75, 90];

  return (
    <div className="flex flex-col gap-2.5">
      <svg
        viewBox={`0 0 ${CW} ${CH}`}
        className="w-full"
        style={{ height: CH }}
      >
        <defs>
          <linearGradient id="gfA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2FAF8F" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#2FAF8F" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="gcA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id="gsA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {grids.map((v) => {
          const y = gy(v);
          return (
            <g key={v}>
              <line
                x1={PL}
                y1={y}
                x2={CW - PR}
                y2={y}
                stroke="currentColor"
                className="text-stone-100 dark:text-stone-800/60"
                strokeWidth="0.5"
                strokeDasharray="3,4"
              />
              <text
                x={PL - 4}
                y={y + 3.5}
                textAnchor="end"
                fontSize="7.5"
                fill="currentColor"
                className="fill-stone-300 dark:fill-stone-700"
              >
                {v}
              </text>
            </g>
          );
        })}

        <path d={area(S)} fill="url(#gsA)" />
        <path d={area(C)} fill="url(#gcA)" />
        <path d={area(F)} fill="url(#gfA)" />
        <path
          d={line(F)}
          fill="none"
          stroke="#2FAF8F"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={line(C)}
          fill="none"
          stroke="#6366f1"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={line(S)}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {[
          { pts: F, color: "#2FAF8F" },
          { pts: C, color: "#6366f1" },
          { pts: S, color: "#f59e0b" },
        ].map(({ pts, color }) => (
          <circle
            key={color}
            cx={pts[n - 1][0]}
            cy={pts[n - 1][1]}
            r="3"
            fill={color}
            stroke="white"
            strokeWidth="1.5"
          />
        ))}

        {rev.map((s, i) => (
          <text
            key={i}
            x={gx(i, n)}
            y={CH - 3}
            textAnchor="middle"
            fontSize="7.5"
            fill="currentColor"
            className="fill-stone-400 dark:fill-stone-600"
          >
            {s.fecha.slice(0, 6)}
          </text>
        ))}
      </svg>

      <div className="flex items-center gap-4 px-1">
        {[
          { color: "bg-[#2FAF8F]", label: "Forraje" },
          { color: "bg-indigo-400", label: "Concentrado" },
          { color: "bg-amber-400", label: "Suplemento" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-[3px] rounded-full ${l.color}`} />
            <span className="text-[10.5px] text-stone-400 dark:text-stone-500">
              {l.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CA GAUGE ─────────────────────────────────────────────────────────────────

const GW = 300,
  GB = 8;
function gaugeX(v: number, min = 5.0, max = 10.0) {
  return Math.max(4, Math.min(GW - 4, ((v - min) / (max - min)) * GW));
}

const ZONES = [
  { x: 0, w: 90, fill: "#2FAF8F", label: "Óptimo" },
  { x: 90, w: 60, fill: "#a3e8d4", label: "Bueno" },
  { x: 150, w: 60, fill: "#fcd34d", label: "Regular" },
  { x: 210, w: 90, fill: "#fca5a5", label: "Alto" },
];

function CAGauge({
  caActual,
  caObjetivo,
  caIndustria,
}: {
  caActual: number;
  caObjetivo: number;
  caIndustria: number;
}) {
  const xA = gaugeX(caActual);
  const xO = gaugeX(caObjetivo);
  const xI = gaugeX(caIndustria);
  const BOTTOM = 14 + GB;

  return (
    <div className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${GW} 50`} className="w-full" style={{ height: 50 }}>
        {ZONES.map((z, i) => (
          <rect
            key={i}
            x={z.x}
            y={14}
            width={z.w}
            height={GB}
            fill={z.fill}
            opacity="0.35"
            rx={i === 0 || i === ZONES.length - 1 ? 4 : 0}
          />
        ))}
        <rect
          x={0}
          y={14}
          width={GW}
          height={GB}
          fill="none"
          stroke="currentColor"
          className="text-stone-200 dark:text-stone-700"
          strokeWidth="0.5"
          rx="4"
        />

        <polygon
          points={`${xO},${BOTTOM + 2} ${xO - 4},${BOTTOM + 10} ${xO + 4},${BOTTOM + 10}`}
          fill="#6366f1"
          opacity="0.7"
        />
        <text
          x={xO}
          y={47}
          textAnchor="middle"
          fontSize="7"
          fill="#6366f1"
          opacity="0.9"
        >
          P-07
        </text>

        <polygon
          points={`${xI},${BOTTOM + 2} ${xI - 4},${BOTTOM + 10} ${xI + 4},${BOTTOM + 10}`}
          fill="#a8a29e"
          opacity="0.7"
        />
        <text
          x={xI}
          y={47}
          textAnchor="middle"
          fontSize="7"
          fill="#a8a29e"
          opacity="0.9"
        >
          Ind.
        </text>

        <line
          x1={xA}
          y1={2}
          x2={xA}
          y2={14}
          stroke="#2FAF8F"
          strokeWidth="1.5"
        />
        <polygon points={`${xA},14 ${xA - 4},6 ${xA + 4},6`} fill="#2FAF8F" />
        <text
          x={xA}
          y={9}
          textAnchor="middle"
          fontSize="8"
          fontWeight="700"
          fill="#2FAF8F"
        >
          {caActual}
        </text>
      </svg>

      <div className="flex text-[9.5px] text-stone-400 dark:text-stone-600 font-medium">
        {ZONES.map((z) => (
          <div
            key={z.label}
            style={{ width: `${(z.w / GW) * 100}%` }}
            className="text-center"
          >
            {z.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export default function TwinsAlimentacionWidget({
  datos,
  siniiga,
  onRefresh,
}: Props) {
  const [vista, setVista] = useState<Vista>("consumo");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [semForm, setSemForm] = useState({
    forraje_pct: "",
    concentrado_pct: "",
    suplemento_pct: "",
    ca_valor: "",
  });

  const inputCls =
    "w-full px-2.5 py-1.5 text-[12px] bg-white dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700 rounded-lg text-stone-700 dark:text-stone-200 placeholder-stone-300 dark:placeholder-stone-600 outline-none focus:border-[#2FAF8F]/50 transition-colors";

  const handleGuardarSemana = async () => {
    if (!siniiga) return;

    // FIX: validación mínima — al menos un campo numérico con valor
    const tieneDatos =
      (semForm.forraje_pct !== "" && !isNaN(Number(semForm.forraje_pct))) ||
      (semForm.concentrado_pct !== "" &&
        !isNaN(Number(semForm.concentrado_pct))) ||
      (semForm.suplemento_pct !== "" && !isNaN(Number(semForm.suplemento_pct)));
    if (!tieneDatos) {
      setSaveError(
        "Ingresa al menos un valor de consumo (forraje, concentrado o suplemento).",
      );
      return;
    }
    const caVal =
      semForm.ca_valor !== "" ? Number(semForm.ca_valor) : undefined;
    if (semForm.ca_valor !== "" && (isNaN(caVal!) || caVal! <= 0)) {
      setSaveError("El valor de CA debe ser un número positivo.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    const { ok, error } = await registrarAlimentacion({
      siniiga,
      forraje_pct: semForm.forraje_pct
        ? Number(semForm.forraje_pct)
        : undefined,
      concentrado_pct: semForm.concentrado_pct
        ? Number(semForm.concentrado_pct)
        : undefined,
      suplemento_pct: semForm.suplemento_pct
        ? Number(semForm.suplemento_pct)
        : undefined,
      ca_valor: caVal,
    });
    setSaving(false);
    if (!ok) {
      setSaveError(error);
      return;
    }
    setShowForm(false);
    setSemForm({
      forraje_pct: "",
      concentrado_pct: "",
      suplemento_pct: "",
      ca_valor: "",
    });
    onRefresh?.();
  };

  const n = datos.semanas.length || 1;
  const promedioF = Math.round(
    datos.semanas.reduce((s, r) => s + r.forraje, 0) / n,
  );
  const promedioC = Math.round(
    datos.semanas.reduce((s, r) => s + r.concentrado, 0) / n,
  );
  const promedioS = Math.round(
    datos.semanas.reduce((s, r) => s + r.suplemento, 0) / n,
  );

  // FIX: supWarn solo activo si hay datos reales — antes daba alerta con semanas vacías
  const supWarn = datos.semanas.length > 0 && promedioS < 85;

  const mejorQueObj = datos.caActual < datos.caObjetivo;
  const pctDif =
    datos.caObjetivo > 0
      ? Math.abs(
          ((datos.caObjetivo - datos.caActual) / datos.caObjetivo) * 100,
        ).toFixed(0)
      : "0";

  // FIX: progPeso consistente con TwinsHeroWidget — usa pesoNacimiento si está disponible
  const pesoNacimiento = datos.pesoNacimiento ?? 0;
  const _rangoPeso = datos.pesoMeta - pesoNacimiento;
  const progPeso =
    _rangoPeso > 0
      ? Math.min(
          100,
          Math.round(((datos.pesoActual - pesoNacimiento) / _rangoPeso) * 100),
        )
      : datos.pesoMeta > 0
        ? Math.min(100, Math.round((datos.pesoActual / datos.pesoMeta) * 100))
        : 0;

  // FIX: si no hay datos de CA, no mostrar vista de conversión
  const tieneCA = datos.caActual > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Botón registrar semana */}
      {siniiga && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              setShowForm((v) => !v);
              setSaveError(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2FAF8F] text-white text-[11px] font-semibold hover:bg-[#27a07f] transition-colors border-0 cursor-pointer"
          >
            <svg
              className="w-3 h-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Registrar semana
          </button>
        </div>
      )}

      {/* Formulario registro semanal */}
      {showForm && siniiga && (
        <div className="flex flex-col gap-3 p-4 rounded-xl border border-stone-200/70 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/40">
          <p className="text-[11.5px] font-semibold text-stone-600 dark:text-stone-300">
            Consumo de esta semana
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Forraje %", key: "forraje_pct", placeholder: "ej: 90" },
              {
                label: "Concentrado %",
                key: "concentrado_pct",
                placeholder: "ej: 85",
              },
              {
                label: "Suplemento %",
                key: "suplemento_pct",
                placeholder: "ej: 80",
              },
              { label: "CA actual", key: "ca_valor", placeholder: "ej: 6.8" },
            ].map((f) => (
              <div key={f.key} className="flex flex-col gap-1">
                <label className="text-[10.5px] font-medium text-stone-400 dark:text-stone-500">
                  {f.label}
                </label>
                <input
                  type="number"
                  placeholder={f.placeholder}
                  value={semForm[f.key as keyof typeof semForm]}
                  onChange={(e) =>
                    setSemForm((p) => ({ ...p, [f.key]: e.target.value }))
                  }
                  className={inputCls}
                />
              </div>
            ))}
          </div>
          {saveError && (
            <p className="text-[11px] text-rose-500">{saveError}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowForm(false);
                setSaveError(null);
              }}
              className="flex-1 py-2 rounded-lg border border-stone-200/70 dark:border-stone-800 text-[11.5px] text-stone-500 hover:text-stone-700 transition-colors bg-transparent cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardarSemana}
              disabled={
                saving ||
                (semForm.forraje_pct === "" &&
                  semForm.concentrado_pct === "" &&
                  semForm.suplemento_pct === "")
              }
              className="flex-1 py-2 rounded-lg bg-[#2FAF8F] text-white text-[11.5px] font-semibold hover:bg-[#27a07f] transition-colors border-0 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando…
                </>
              ) : (
                "Guardar semana"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Toggle — FIX: solo muestra "Conversión CA" si hay datos reales */}
      <div className="flex items-center justify-between">
        <p className="text-[13.5px] font-semibold text-stone-800 dark:text-stone-100">
          Alimentación
        </p>
        {tieneCA ? (
          <div className="flex items-center gap-0.5 bg-stone-100 dark:bg-stone-800/50 rounded-[10px] p-0.5">
            {(["consumo", "conversion"] as Vista[]).map((v) => (
              <button
                key={v}
                onClick={() => setVista(v)}
                className={`px-3 py-1.5 rounded-[8px] text-[11px] font-medium transition-all cursor-pointer border-0
                  ${
                    vista === v
                      ? "bg-white dark:bg-[#1c1917] text-stone-700 dark:text-stone-200 shadow-sm"
                      : "bg-transparent text-stone-400 dark:text-stone-500"
                  }`}
              >
                {v === "consumo" ? "Consumo" : "Conversión CA"}
              </button>
            ))}
          </div>
        ) : (
          // Sin datos de CA — solo muestra la etiqueta activa sin toggle
          <span className="text-[11px] text-stone-400 dark:text-stone-500 px-2.5 py-1 bg-stone-100 dark:bg-stone-800/50 rounded-[8px]">
            Consumo
          </span>
        )}
      </div>

      {/* ── CONSUMO ── */}
      {vista === "consumo" && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Forraje", value: promedioF, warn: false },
              { label: "Concentrado", value: promedioC, warn: false },
              { label: "Suplemento", value: promedioS, warn: supWarn },
            ].map((m, i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[10px] px-3 py-3 text-center"
              >
                <p
                  className={`text-[22px] font-extrabold leading-none tabular-nums ${m.warn ? "text-amber-500" : datos.semanas.length === 0 ? "text-stone-300 dark:text-stone-700" : "text-[#2FAF8F]"}`}
                >
                  {datos.semanas.length === 0 ? "—" : m.value}
                  {datos.semanas.length > 0 && (
                    <span className="text-[13px] font-bold opacity-70">%</span>
                  )}
                </p>
                <p className="text-[10.5px] text-stone-400 dark:text-stone-500 mt-1">
                  {m.label}
                </p>
                {m.warn && (
                  <p className="text-[9.5px] text-amber-400 mt-0.5 flex items-center justify-center gap-1">
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <line x1="12" y1="5" x2="12" y2="13" />
                      <circle cx="12" cy="18" r="1" fill="currentColor" />
                    </svg>
                    tendencia baja
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[12px] px-4 py-3.5">
            <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.07em] mb-3">
              Tendencia 4 semanas · % vs objetivo
            </p>
            <LineChart semanas={datos.semanas} />
          </div>

          {/* Bloque de alerta suplemento — solo con datos reales */}
          {supWarn &&
            (() => {
              const OBJETIVO_SUP = 90;
              const brecha = OBJETIVO_SUP - promedioS;
              const tendencia = [...datos.semanas]
                .reverse()
                .map((s) => s.suplemento);
              return (
                <div className="bg-white dark:bg-[#1c1917] border border-amber-200/80 dark:border-amber-800/30 rounded-[12px] px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <svg
                          className="text-amber-500 shrink-0"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        >
                          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <p className="text-[12px] font-semibold text-stone-700 dark:text-stone-200">
                          Suplemento mineral
                        </p>
                      </div>
                      <p className="text-[11px] text-stone-400 dark:text-stone-500">
                        Caída progresiva · requiere ajuste antes del próximo
                        registro
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] font-bold text-amber-500 dark:text-amber-400 font-mono">
                      {promedioS}%
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3.5">
                    {[
                      {
                        label: "Actual",
                        value: `${promedioS}%`,
                        color: "text-amber-500 dark:text-amber-400",
                      },
                      {
                        label: "Objetivo",
                        value: `${OBJETIVO_SUP}%`,
                        color: "text-stone-600 dark:text-stone-300",
                      },
                      {
                        label: "Brecha",
                        value: `−${brecha}%`,
                        color: "text-rose-500 dark:text-rose-400",
                      },
                    ].map((c) => (
                      <div
                        key={c.label}
                        className="bg-stone-50 dark:bg-[#141210] rounded-[8px] px-2.5 py-2 text-center"
                      >
                        <p
                          className={`text-[17px] font-extrabold leading-none tabular-nums ${c.color}`}
                        >
                          {c.value}
                        </p>
                        <p className="text-[9.5px] text-stone-400 dark:text-stone-600 mt-1">
                          {c.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mb-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9.5px] text-stone-400 dark:text-stone-600 uppercase tracking-[0.06em]">
                        Brecha vs objetivo
                      </span>
                      <span className="text-[9.5px] font-mono text-stone-400 dark:text-stone-500">
                        {promedioS} / {OBJETIVO_SUP}
                      </span>
                    </div>
                    <div className="h-1.5 bg-stone-100 dark:bg-stone-800/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{
                          width: `${(promedioS / OBJETIVO_SUP) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-[9.5px] text-stone-400 dark:text-stone-600 uppercase tracking-[0.06em] mb-1.5">
                      Tendencia semanal
                    </p>
                    <div className="flex items-end gap-1.5 h-8">
                      {tendencia.map((v, i) => {
                        const h = Math.max(10, Math.round((v / 100) * 32));
                        const isLast = i === tendencia.length - 1;
                        return (
                          <div
                            key={i}
                            className="flex-1 flex flex-col items-center gap-0.5"
                          >
                            <span className="text-[8.5px] font-mono text-stone-400 dark:text-stone-600">
                              {v}
                            </span>
                            <div
                              className={`w-full rounded-[3px] ${isLast ? "bg-amber-400" : "bg-stone-200 dark:bg-stone-700/60"}`}
                              style={{ height: h }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-1.5 mt-1">
                      {[...datos.semanas].reverse().map((s, i) => (
                        <div key={i} className="flex-1 text-center">
                          <span className="text-[8.5px] text-stone-300 dark:text-stone-700">
                            {s.fecha.slice(0, 6)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
        </>
      )}

      {/* ── CONVERSIÓN — solo si tieneCA ── */}
      {vista === "conversion" && tieneCA && (
        <>
          <div className="bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[12px] px-4 py-4">
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-stone-400 dark:text-stone-500 mb-1">
                  Conversión Alimenticia
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[52px] font-extrabold leading-none text-stone-800 dark:text-stone-100 tabular-nums">
                    {datos.caActual}
                  </span>
                  <span className="text-[12px] text-stone-400 dark:text-stone-500 mb-1">
                    kg alim / kg ganancia
                  </span>
                </div>
              </div>
              <span
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-[7px] border mb-1 ${
                  mejorQueObj
                    ? "bg-[#2FAF8F]/08 border-[#2FAF8F]/25 text-[#2FAF8F]"
                    : "bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/20 dark:border-amber-800/30 dark:text-amber-400"
                }`}
              >
                {mejorQueObj
                  ? `${pctDif}% mejor que P-07`
                  : `${pctDif}% por encima`}
              </span>
            </div>

            <div className="border-t border-stone-100 dark:border-stone-800/40 pt-3.5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.07em]">
                  Escala CA · 5.0 – 10.0
                </p>
                <div className="flex items-center gap-3 text-[10.5px] text-stone-400 dark:text-stone-500">
                  <span>
                    Objetivo P-07:{" "}
                    <span className="font-mono text-stone-600 dark:text-stone-300">
                      {datos.caObjetivo}
                    </span>
                  </span>
                  <span>
                    Industria:{" "}
                    <span className="font-mono text-stone-600 dark:text-stone-300">
                      {datos.caIndustria}
                    </span>
                  </span>
                </div>
              </div>
              <CAGauge
                caActual={datos.caActual}
                caObjetivo={datos.caObjetivo}
                caIndustria={datos.caIndustria}
              />
            </div>
          </div>

          {/* Proyección */}
          <div className="bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[12px] px-4 py-3.5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12.5px] font-semibold text-stone-700 dark:text-stone-200">
                Proyección de salida
              </p>
              <span className="font-mono text-[10.5px] text-stone-400 dark:text-stone-500">
                {datos.proyFecha}
              </span>
            </div>

            <div className="flex items-center gap-3 mb-3.5">
              <div className="text-center px-3 py-2 bg-stone-50 dark:bg-[#141210] border border-stone-200/60 dark:border-stone-800/50 rounded-[8px] shrink-0">
                <p className="text-[28px] font-extrabold text-[#2FAF8F] leading-none tabular-nums">
                  {datos.proyDias}
                </p>
                <p className="text-[9px] text-stone-400 dark:text-stone-500 uppercase tracking-wide mt-1">
                  días
                </p>
              </div>
              <p className="text-[12px] text-stone-500 dark:text-stone-400 leading-relaxed">
                A este ritmo alcanzará la meta de{" "}
                <span className="font-bold text-stone-700 dark:text-stone-200">
                  {datos.pesoMeta} kg
                </span>
              </p>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-[10.5px] text-stone-400 dark:text-stone-500">
                  Peso actual estimado
                </span>
                <span className="font-mono text-[11px] font-bold text-stone-700 dark:text-stone-200">
                  {datos.pesoActual} / {datos.pesoMeta} kg
                </span>
              </div>
              <div className="h-2 bg-stone-100 dark:bg-stone-800/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2FAF8F] rounded-full transition-all duration-700"
                  style={{ width: `${progPeso}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9.5px] text-stone-300 dark:text-stone-700">
                  {pesoNacimiento > 0 ? `${pesoNacimiento} kg` : "0 kg"}
                </span>
                <span className="text-[9.5px] text-stone-300 dark:text-stone-700">
                  {datos.pesoMeta} kg
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}