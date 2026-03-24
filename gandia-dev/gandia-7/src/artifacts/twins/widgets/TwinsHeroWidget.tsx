/**
 * TwinsHeroWidget
 * ARCHIVO → src/artifacts/twins/widgets/TwinsHeroWidget.tsx
 *
 * Ficha de identidad del animal — protagonista del Gemelo Digital.
 * Sin emojis. Conectado a Supabase via useTwinsData.ts
 *
 * FIXES:
 * - diasMeta = 0 / null muestra "—" en lugar de desaparecer silencioso
 * - Progreso de peso con guard para rango = 0
 */

export interface AnimalPerfil {
  arete: string;
  nombre?: string;
  raza: string;
  sexo: "Macho" | "Hembra";
  edadMeses: number;
  lote: string;
  corral: string;
  upp: string;
  pesoActual: number;
  pesoNacimiento: number;
  pesoMeta: number;
  gananciaDiaria: number;
  estado: "engorda" | "cría" | "reproducción" | "cuarentena";
  alertas: number;
}

interface Props {
  perfil: AnimalPerfil;
}

// ─── ÍCONOS ──────────────────────────────────────────────────────────────────

function IcoArete() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IcoLote() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function IcoEdad() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IcoRaza() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
    </svg>
  );
}
function IcoAlerta() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

// ─── ESTADO CONFIG ────────────────────────────────────────────────────────────

const ESTADO_CFG = {
  engorda: {
    label: "En engorda",
    color: "text-[#2FAF8F]",
    bg: "bg-[#2FAF8F]/08 border-[#2FAF8F]/25 dark:bg-[#2FAF8F]/12",
  },
  cría: {
    label: "Cría",
    color: "text-indigo-500 dark:text-indigo-400",
    bg: "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-800/30",
  },
  reproducción: {
    label: "Reproducción",
    color: "text-violet-500 dark:text-violet-400",
    bg: "bg-violet-50 border-violet-200 dark:bg-violet-950/20 dark:border-violet-800/30",
  },
  cuarentena: {
    label: "Cuarentena",
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/30",
  },
};

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export default function TwinsHeroWidget({ perfil }: Props) {
  const estado = ESTADO_CFG[perfil.estado];

  const _rangoPeso = perfil.pesoMeta - perfil.pesoNacimiento;
  const progPeso =
    _rangoPeso > 0
      ? Math.min(
          100,
          Math.round(
            ((perfil.pesoActual - perfil.pesoNacimiento) / _rangoPeso) * 100,
          ),
        )
      : 0;

  // FIX: diasMeta siempre muestra algo — "—" cuando no hay ganancia registrada
  const diasMeta =
    perfil.gananciaDiaria > 0
      ? Math.ceil((perfil.pesoMeta - perfil.pesoActual) / perfil.gananciaDiaria)
      : null;

  const metaInfo = [
    { icon: <IcoArete />, label: "Arete", value: perfil.arete },
    { icon: <IcoRaza />, label: "Raza", value: perfil.raza },
    { icon: <IcoEdad />, label: "Edad", value: `${perfil.edadMeses} meses` },
    {
      icon: <IcoLote />,
      label: "Lote",
      value: `${perfil.corral} · ${perfil.upp}`,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* ── Encabezado identidad ── */}
      <div className="bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[12px] overflow-hidden">
        {/* Banda superior */}
        <div className="h-1 bg-[#2FAF8F]" />

        <div className="px-4 py-3.5 flex items-start justify-between gap-3">
          {/* Datos principales */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-[5px] border ${estado.bg} ${estado.color}`}
              >
                {estado.label}
              </span>
              {perfil.alertas > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 px-2 py-0.5 rounded-[5px]">
                  <IcoAlerta /> {perfil.alertas} alerta
                  {perfil.alertas > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-[20px] font-extrabold text-stone-900 dark:text-stone-50 leading-none tracking-tight">
                {perfil.arete}
              </h2>
              {perfil.nombre && (
                <span className="text-[14px] text-stone-400 dark:text-stone-500 font-medium">
                  {perfil.nombre}
                </span>
              )}
            </div>
            <p className="text-[12px] text-stone-500 dark:text-stone-400 mt-0.5">
              {perfil.raza} · {perfil.sexo}
            </p>
          </div>

          {/* Peso hero */}
          <div className="shrink-0 text-right">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-stone-400 dark:text-stone-500">
              Peso actual
            </p>
            <p className="text-[34px] font-extrabold text-stone-900 dark:text-stone-50 leading-none tabular-nums">
              {perfil.pesoActual}
              <span className="text-[16px] font-semibold text-stone-400 dark:text-stone-500">
                {" "}
                kg
              </span>
            </p>
            {perfil.gananciaDiaria > 0 && (
              <p className="text-[11px] text-[#2FAF8F] font-semibold mt-0.5 tabular-nums">
                +{perfil.gananciaDiaria} kg/día
              </p>
            )}
          </div>
        </div>

        {/* Grid metadata */}
        <div className="grid grid-cols-2 border-t border-stone-100 dark:border-stone-800/40">
          {metaInfo.map((m, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-4 py-2.5 text-[11.5px]
                ${i % 2 === 0 && i < metaInfo.length - 1 ? "border-r border-stone-100 dark:border-stone-800/40" : ""}
                ${i < 2 ? "border-b border-stone-100 dark:border-stone-800/40" : ""}
              `}
            >
              <span className="text-stone-400 dark:text-stone-500 shrink-0">
                {m.icon}
              </span>
              <span className="text-stone-400 dark:text-stone-500 shrink-0">
                {m.label}
              </span>
              <span className="font-medium text-stone-700 dark:text-stone-200 truncate">
                {m.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Progreso hacia meta ── */}
      <div className="bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[12px] px-4 py-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[11.5px] font-semibold text-stone-600 dark:text-stone-300">
            Progreso hacia meta de engorda
          </p>
          <div className="flex items-center gap-2">
            {/* FIX: siempre muestra algo — "—" si no hay ganancia */}
            <span className="font-mono text-[10.5px] text-stone-400 dark:text-stone-500">
              {diasMeta != null ? `~${diasMeta} días` : "— días"}
            </span>
            <span className="font-mono text-[11.5px] font-bold text-[#2FAF8F]">
              {progPeso}%
            </span>
          </div>
        </div>

        <div className="relative mb-3">
          <div className="h-2.5 bg-stone-100 dark:bg-stone-800/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2FAF8F] rounded-full transition-all duration-700"
              style={{ width: `${progPeso}%` }}
            />
          </div>
        </div>

        {/* Hitos */}
        <div className="flex items-center justify-between text-[10.5px]">
          <div className="flex flex-col gap-0.5">
            <span className="font-mono font-semibold text-stone-500 dark:text-stone-400">
              {perfil.pesoNacimiento} kg
            </span>
            <span className="text-stone-400 dark:text-stone-600">
              Nacimiento
            </span>
          </div>
          <div className="flex flex-col gap-0.5 text-center">
            <span className="font-mono font-bold text-stone-800 dark:text-stone-100">
              {perfil.pesoActual} kg
            </span>
            <span className="text-stone-400 dark:text-stone-600">Hoy</span>
          </div>
          <div className="flex flex-col gap-0.5 text-right">
            <span className="font-mono font-semibold text-stone-500 dark:text-stone-400">
              {perfil.pesoMeta} kg
            </span>
            <span className="text-stone-400 dark:text-stone-600">Meta</span>
          </div>
        </div>

        {/* FIX: aviso si no hay ganancia diaria registrada */}
        {perfil.gananciaDiaria === 0 && (
          <p className="mt-2.5 text-[10.5px] text-stone-400 dark:text-stone-500 text-center">
            Registra pesajes para calcular la proyección
          </p>
        )}
      </div>
    </div>
  );
}