/**
 * TwinsTimelineWidget
 * ARCHIVO → src/artifacts/twins/widgets/TwinsTimelineWidget.tsx
 *
 * Timeline vertical completo: movilizaciones, vacunaciones, pesajes, auditorías, tratamientos.
 * Sin emojis. Conectado a Supabase via useTwinsData.ts
 */
import { useState } from "react";
import { registrarEvento } from "../../../lib/twinsService";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export type EventoTipo =
  | "movilizacion"
  | "vacunacion"
  | "pesaje"
  | "auditoria"
  | "tratamiento";
export type EventoCert = "completa" | "parcial" | "pendiente";

export interface EventoTimeline {
  id: number;
  fecha: string;
  tipo: EventoTipo;
  titulo: string;
  detalle?: string;
  valor?: string;
  cert: EventoCert;
  ubicacion?: string;
}

// Alias backward-compat con mockData existente
export type Movilizacion = EventoTimeline;

interface Props {
  eventos: EventoTimeline[];
  ubicacionActual?: string;
  siniiga?: string;         // si se pasa, habilita el formulario de captura
  onRefresh?: () => void;   // para recargar eventos tras guardar
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const CERT_CFG: Record<EventoCert, { label: string; badge: string }> = {
  completa: {
    label: "Certificado",
    badge: "text-[#2FAF8F] border-[#2FAF8F]/25",
  },
  parcial: {
    label: "Parcial",
    badge:
      "text-amber-500 dark:text-amber-400 border-amber-300/50 dark:border-amber-700/40",
  },
  pendiente: {
    label: "Pendiente",
    badge:
      "text-stone-400 dark:text-stone-500 border-stone-200 dark:border-stone-700/50",
  },
};

const TIPO_CFG: Record<EventoTipo, { label: string; nodeColor: string }> = {
  movilizacion: {
    label: "Movilización",
    nodeColor: "text-indigo-500 dark:text-indigo-400",
  },
  vacunacion: {
    label: "Vacunación",
    nodeColor: "text-violet-500 dark:text-violet-400",
  },
  pesaje: { label: "Pesaje", nodeColor: "text-[#2FAF8F]" },
  auditoria: {
    label: "Auditoría",
    nodeColor: "text-amber-500 dark:text-amber-400",
  },
  tratamiento: {
    label: "Tratamiento",
    nodeColor: "text-rose-500 dark:text-rose-400",
  },
};

// ─── ÍCONOS ───────────────────────────────────────────────────────────────────

function IcoMovilizacion() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
function IcoVacunacion() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m18 2 4 4" />
      <path d="m17 7 3-3" />
      <path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5" />
      <path d="m9 11 4 4" />
      <path d="m5 19-3 3" />
    </svg>
  );
}
function IcoPesaje() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
function IcoAuditoria() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
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
function IcoTratamiento() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function NodeIcon({ tipo }: { tipo: EventoTipo }) {
  const cfg = TIPO_CFG[tipo];
  return (
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${cfg.nodeColor}`}
    >
      {tipo === "movilizacion" && <IcoMovilizacion />}
      {tipo === "vacunacion" && <IcoVacunacion />}
      {tipo === "pesaje" && <IcoPesaje />}
      {tipo === "auditoria" && <IcoAuditoria />}
      {tipo === "tratamiento" && <IcoTratamiento />}
    </div>
  );
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

const FILTROS: { key: EventoTipo | "todos"; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "movilizacion", label: "Movilización" },
  { key: "pesaje", label: "Pesaje" },
  { key: "vacunacion", label: "Vacunación" },
  { key: "auditoria", label: "Auditoría" },
  { key: "tratamiento", label: "Tratamiento" },
];

export default function TwinsTimelineWidget({
  eventos,
  ubicacionActual,
  siniiga,
  onRefresh,
}: Props) {
  const [expanded,   setExpanded]   = useState<number | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<EventoTipo | "todos">("todos");
  const [showForm,   setShowForm]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState<string | null>(null);
  const [form, setForm] = useState({
    tipo:      "movilizacion" as EventoTipo,
    titulo:    "",
    valor:     "",
    ubicacion: "",
    cert:      "pendiente" as EventoCert,
  });

  const handleGuardar = async () => {
    if (!siniiga || !form.titulo.trim()) return;
    setSaving(true);
    setSaveError(null);
    const { ok, error } = await registrarEvento({
      siniiga,
      tipo:      form.tipo,
      titulo:    form.titulo.trim(),
      valor:     form.valor   || undefined,
      cert:      form.cert,
      ubicacion: form.ubicacion || undefined,
    });
    setSaving(false);
    if (!ok) { setSaveError(error); return; }
    setShowForm(false);
    setForm({ tipo: "movilizacion", titulo: "", valor: "", ubicacion: "", cert: "pendiente" });
    onRefresh?.();
  };

  const inputCls = "w-full px-2.5 py-1.5 text-[12px] bg-white dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700 rounded-lg text-stone-700 dark:text-stone-200 placeholder-stone-300 dark:placeholder-stone-600 outline-none focus:border-[#2FAF8F]/50 transition-colors";

  const tiposPresentes = new Set(eventos.map((e) => e.tipo));
  const filtrados =
    filtroTipo === "todos"
      ? eventos
      : eventos.filter((e) => e.tipo === filtroTipo);
  const totalCerts = eventos.filter((e) => e.cert === "completa").length;
  const totalPendientes = eventos.filter((e) => e.cert !== "completa").length;

  return (
    <div className="flex flex-col gap-4">
      {/* Header con botón nuevo evento */}
      {siniiga && (
        <div className="flex items-center justify-between">
          <p className="text-[13.5px] font-semibold text-stone-800 dark:text-stone-100">Timeline</p>
          <button
            onClick={() => { setShowForm(v => !v); setSaveError(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2FAF8F] text-white text-[11px] font-semibold hover:bg-[#27a07f] transition-colors border-0 cursor-pointer"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Registrar evento
          </button>
        </div>
      )}

      {/* Formulario nuevo evento */}
      {showForm && siniiga && (
        <div className="flex flex-col gap-3 p-4 rounded-xl border border-stone-200/70 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/40">
          <p className="text-[11.5px] font-semibold text-stone-600 dark:text-stone-300">Nuevo evento</p>

          {/* Tipo */}
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-medium text-stone-400 dark:text-stone-500">Tipo</label>
            <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value as EventoTipo }))} className={inputCls}>
              <option value="movilizacion">Movilización</option>
              <option value="vacunacion">Vacunación</option>
              <option value="pesaje">Pesaje</option>
              <option value="tratamiento">Tratamiento</option>
              <option value="auditoria">Auditoría</option>
            </select>
          </div>

          {/* Título */}
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-medium text-stone-400 dark:text-stone-500">Descripción *</label>
            <input type="text" placeholder="ej: Traslado a Corral 3" value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} className={inputCls} />
          </div>

          {/* Valor */}
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-medium text-stone-400 dark:text-stone-500">Valor / detalle (opcional)</label>
            <input type="text" placeholder="ej: 450 kg · 2 ml IM" value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} className={inputCls} />
          </div>

          {/* Ubicación */}
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-medium text-stone-400 dark:text-stone-500">Ubicación (opcional)</label>
            <input type="text" placeholder="ej: Corral 3" value={form.ubicacion} onChange={e => setForm(p => ({ ...p, ubicacion: e.target.value }))} className={inputCls} />
          </div>

          {/* Certificación */}
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-medium text-stone-400 dark:text-stone-500">Certificación</label>
            <select value={form.cert} onChange={e => setForm(p => ({ ...p, cert: e.target.value as EventoCert }))} className={inputCls}>
              <option value="pendiente">Pendiente</option>
              <option value="parcial">Parcial</option>
              <option value="completa">Completa</option>
            </select>
          </div>

          {saveError && <p className="text-[11px] text-rose-500">{saveError}</p>}

          <div className="flex gap-2">
            <button onClick={() => { setShowForm(false); setSaveError(null); }} className="flex-1 py-2 rounded-lg border border-stone-200/70 dark:border-stone-800 text-[11.5px] text-stone-500 hover:text-stone-700 transition-colors bg-transparent cursor-pointer">
              Cancelar
            </button>
            <button onClick={handleGuardar} disabled={saving || !form.titulo.trim()} className="flex-1 py-2 rounded-lg bg-[#2FAF8F] text-white text-[11.5px] font-semibold hover:bg-[#27a07f] transition-colors border-0 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5">
              {saving ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Guardando…</> : "Guardar evento"}
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          {
            label: "Eventos",
            value: eventos.length,
            color: "text-stone-800 dark:text-stone-100",
            small: false,
          },
          {
            label: "Certificados",
            value: totalCerts,
            color: "text-[#2FAF8F]",
            small: false,
          },
          {
            label: "Pendientes",
            value: totalPendientes,
            color:
              totalPendientes > 0
                ? "text-amber-500 dark:text-amber-400"
                : "text-stone-400",
            small: false,
          },
          {
            label: "Ubicación",
            value: ubicacionActual ?? "—",
            color: "text-stone-700 dark:text-stone-200",
            small: true,
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[10px] px-2.5 py-2.5 text-center"
          >
            <p
              className={`font-bold leading-none tabular-nums mt-0.5 ${s.small ? "text-[13px]" : "text-[19px]"} ${s.color}`}
            >
              {s.value}
            </p>
            <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1 uppercase tracking-wide">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTROS.filter(
          (t) => t.key === "todos" || tiposPresentes.has(t.key as EventoTipo),
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setFiltroTipo(t.key as EventoTipo | "todos")}
            className={`px-2.5 py-1 rounded-[7px] text-[11px] font-medium transition-all cursor-pointer border
              ${
                filtroTipo === t.key
                  ? "bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 border-transparent"
                  : "bg-white dark:bg-[#1c1917] text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-800/50 hover:border-stone-300 dark:hover:border-stone-700"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {filtrados.length === 0 ? (
        <div className="py-8 text-center text-[12px] text-stone-400 dark:text-stone-500">
          Sin eventos de este tipo
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[13px] top-4 bottom-4 w-px bg-stone-100 dark:bg-stone-800/50" />
          <div className="flex flex-col gap-2.5">
            {filtrados.map((ev) => {
              const cert = CERT_CFG[ev.cert];
              const tipo = TIPO_CFG[ev.tipo];
              const isOpen = expanded === ev.id;

              return (
                <div key={ev.id} className="flex gap-3">
                  <div className="shrink-0 z-10 mt-[7px]">
                    <NodeIcon tipo={ev.tipo} />
                  </div>

                  <div
                    onClick={() => setExpanded(isOpen ? null : ev.id)}
                    className={`flex-1 min-w-0 rounded-[10px] overflow-hidden cursor-pointer transition-all
                      bg-white dark:bg-[#1c1917]
                      ${
                        ev.cert !== "completa"
                          ? "border border-l-[3px] border-amber-200 dark:border-amber-800/40 border-l-amber-400 dark:border-l-amber-600"
                          : "border border-stone-200/60 dark:border-stone-800/50"
                      }
                      hover:shadow-sm`}
                  >
                    <div className="flex items-start justify-between gap-2 px-3.5 py-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-[0.07em] ${tipo.nodeColor}`}
                          >
                            {tipo.label}
                          </span>
                          <span className="text-stone-200 dark:text-stone-700">
                            ·
                          </span>
                          <span className="font-mono text-[10px] text-stone-400 dark:text-stone-500">
                            {ev.fecha}
                          </span>
                        </div>
                        <p className="text-[13px] font-semibold text-stone-800 dark:text-stone-100 leading-snug">
                          {ev.titulo}
                        </p>
                        {(ev.valor || ev.ubicacion) && (
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {ev.valor && (
                              <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">
                                {ev.valor}
                              </span>
                            )}
                            {ev.ubicacion && (
                              <span className="text-[11px] text-stone-400 dark:text-stone-500">
                                {ev.ubicacion}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 pt-0.5">
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-[5px] border whitespace-nowrap ${cert.badge}`}
                        >
                          {cert.label}
                        </span>
                        {ev.detalle && (
                          <svg
                            className={`w-3 h-3 text-stone-300 dark:text-stone-600 transition-transform duration-150 shrink-0 ${isOpen ? "rotate-180" : ""}`}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {isOpen && ev.detalle && (
                      <div className="px-3.5 py-2.5 border-t border-stone-100 dark:border-stone-800/40 bg-stone-50/60 dark:bg-stone-800/20">
                        <p className="text-[12px] text-stone-500 dark:text-stone-400 leading-relaxed">
                          {ev.detalle}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}