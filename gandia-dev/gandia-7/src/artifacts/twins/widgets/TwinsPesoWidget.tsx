/**
 * TwinsPesoWidget
 * ARCHIVO → src/artifacts/twins/widgets/TwinsPesoWidget.tsx
 *
 * Curva de crecimiento: peso real vs curva objetivo.
 * Sin emojis. Conectado a Supabase via useTwinsData.ts
 */

export interface RegistroPeso {
  fecha: string; // 'DD MMM'
  peso: number; // kg real
  objetivo?: number; // kg objetivo esperado para esa fecha
}

interface Props {
  registros: RegistroPeso[];
  pesoMeta: number;
  gananciaDiaria: number;
}

// ─── CHART CONFIG ─────────────────────────────────────────────────────────────

const W = 340;
const H = 120;
const PAD_L = 36;
const PAD_R = 12;
const PAD_T = 10;
const PAD_B = 22;
const DRAW_W = W - PAD_L - PAD_R;
const DRAW_H = H - PAD_T - PAD_B;

function getXY(
  i: number,
  n: number,
  v: number,
  min: number,
  max: number,
): [number, number] {
  const x = PAD_L + (i / Math.max(n - 1, 1)) * DRAW_W;
  const rango = max - min
  const y = rango > 0
    ? PAD_T + (1 - (v - min) / rango) * DRAW_H
    : PAD_T + DRAW_H / 2;
  return [x, y];
}

function linePath(points: [number, number][]) {
  return points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
}

function areaPath(points: [number, number][]) {
  if (!points.length) return "";
  const last = points[points.length - 1];
  const first = points[0];
  return `${linePath(points)} L${last[0].toFixed(1)},${(PAD_T + DRAW_H).toFixed(1)} L${first[0].toFixed(1)},${(PAD_T + DRAW_H).toFixed(1)} Z`;
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export default function TwinsPesoWidget({
  registros,
  pesoMeta,
  gananciaDiaria,
}: Props) {
  if (!registros.length) return null;

  const allPesos = registros.map((r) => r.peso);
  const allObjs = registros
    .filter((r) => r.objetivo != null)
    .map((r) => r.objetivo!);
  const allVals = [...allPesos, ...allObjs];
  const rawMin = Math.min(...allVals);
  const rawMax = Math.max(...allVals, pesoMeta);
  const pad = (rawMax - rawMin) * 0.12;
  const vMin = Math.floor(rawMin - pad);
  const vMax = Math.ceil(rawMax + pad);

  const n = registros.length;

  const puntosReal = registros.map(
    (r, i) => getXY(i, n, r.peso, vMin, vMax) as [number, number],
  );
  const puntosObj = registros
    .filter((r) => r.objetivo != null)
    .map(
      (r, i) =>
        getXY(
          i,
          registros.filter((x) => x.objetivo != null).length || n,
          r.objetivo!,
          vMin,
          vMax,
        ) as [number, number],
    );

  const gridVals = [
    Math.round(vMin + (vMax - vMin) * 0.25),
    Math.round(vMin + (vMax - vMin) * 0.5),
    Math.round(vMin + (vMax - vMin) * 0.75),
  ];

  // Punto más reciente
  const ultimo = puntosReal[puntosReal.length - 1];
  const penultimo =
    puntosReal.length > 1 ? puntosReal[puntosReal.length - 2] : null;
  const tendencia = penultimo
    ? registros[n - 1].peso - registros[n - 2].peso
    : 0;

  return (
    <div className="bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[12px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-stone-800/40">
        <div>
          <p className="text-[12.5px] font-semibold text-stone-700 dark:text-stone-200">
            Curva de crecimiento
          </p>
          <p className="text-[10.5px] text-stone-400 dark:text-stone-500 mt-0.5">
            Peso registrado vs objetivo
          </p>
        </div>
        <div className="flex items-center gap-3">
          {tendencia !== 0 && (
            <span
              className={`font-mono text-[11px] font-semibold ${tendencia > 0 ? "text-[#2FAF8F]" : "text-amber-500"}`}
            >
              {tendencia > 0 ? "+" : ""}
              {tendencia.toFixed(1)} kg
            </span>
          )}
          <span className="text-[10px] text-stone-400 dark:text-stone-500">
            último registro
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="px-2 pt-2 pb-1">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
          <defs>
            <linearGradient id="pgrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2FAF8F" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#2FAF8F" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="ograd" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid horizontales */}
          {gridVals.map((v) => {
            const y = PAD_T + (1 - (v - vMin) / (vMax - vMin)) * DRAW_H;
            return (
              <g key={v}>
                <line
                  x1={PAD_L}
                  y1={y}
                  x2={W - PAD_R}
                  y2={y}
                  stroke="currentColor"
                  className="text-stone-100 dark:text-stone-800/60"
                  strokeWidth="0.5"
                  strokeDasharray="3,4"
                />
                <text
                  x={PAD_L - 4}
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

          {/* Línea de meta */}
          {(() => {
            const yMeta =
              PAD_T + (1 - (pesoMeta - vMin) / (vMax - vMin)) * DRAW_H;
            return (
              <>
                <line
                  x1={PAD_L}
                  y1={yMeta}
                  x2={W - PAD_R}
                  y2={yMeta}
                  stroke="#2FAF8F"
                  strokeWidth="0.8"
                  strokeDasharray="4,4"
                  opacity="0.35"
                />
                <text
                  x={W - PAD_R + 2}
                  y={yMeta + 3.5}
                  fontSize="7.5"
                  fill="#2FAF8F"
                  opacity="0.55"
                >
                  {pesoMeta}
                </text>
              </>
            );
          })()}

          {/* Área + línea objetivo */}
          {puntosObj.length >= 2 && (
            <>
              <path d={areaPath(puntosObj)} fill="url(#ograd)" />
              <path
                d={linePath(puntosObj)}
                fill="none"
                stroke="#6366f1"
                strokeWidth="1.2"
                strokeDasharray="5,3"
                opacity="0.6"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* Área + línea real */}
          {puntosReal.length >= 2 && (
            <>
              <path d={areaPath(puntosReal)} fill="url(#pgrad)" />
              <path
                d={linePath(puntosReal)}
                fill="none"
                stroke="#2FAF8F"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </>
          )}

          {/* Puntos data */}
          {puntosReal.map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill="#2FAF8F"
              stroke="white"
              strokeWidth="1.5"
            />
          ))}

          {/* Tooltip último punto */}
          {ultimo &&
            (() => {
              const [x, y] = ultimo;
              const val = registros[n - 1].peso;
              const rectW = 38;
              const rectH = 16;
              const rx = x + rectW + 4 > W ? x - rectW - 4 : x + 4;
              return (
                <>
                  <rect
                    x={rx}
                    y={y - rectH / 2}
                    width={rectW}
                    height={rectH}
                    rx="4"
                    fill="#2FAF8F"
                    opacity="0.9"
                  />
                  <text
                    x={rx + rectW / 2}
                    y={y + 4}
                    textAnchor="middle"
                    fontSize="8.5"
                    fontWeight="700"
                    fill="white"
                  >
                    {val} kg
                  </text>
                </>
              );
            })()}

          {/* Eje X — fechas */}
          {registros.map((r, i) => {
            const [x] = getXY(i, n, r.peso, vMin, vMax);
            return (
              <text
                key={i}
                x={x}
                y={H - 3}
                textAnchor="middle"
                fontSize="7.5"
                fill="currentColor"
                className="fill-stone-400 dark:fill-stone-600"
              >
                {r.fecha.slice(0, 6)}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 px-4 pb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-[2.5px] rounded-full bg-[#2FAF8F]" />
          <span className="text-[10.5px] text-stone-400 dark:text-stone-500">
            Real
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-[2px] rounded-full bg-indigo-400 opacity-60"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg,#6366f1 0 4px,transparent 4px 7px)",
            }}
          />
          <span className="text-[10.5px] text-stone-400 dark:text-stone-500">
            Objetivo
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-[1px] rounded-full bg-[#2FAF8F] opacity-35"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg,#2FAF8F 0 3px,transparent 3px 6px)",
            }}
          />
          <span className="text-[10.5px] text-stone-400 dark:text-stone-500">
            Meta {pesoMeta} kg
          </span>
        </div>
        {gananciaDiaria > 0 && (
          <span className="ml-auto font-mono text-[10.5px] text-stone-400 dark:text-stone-500">
            {gananciaDiaria} kg/día prom.
          </span>
        )}
      </div>
    </div>
  );
}