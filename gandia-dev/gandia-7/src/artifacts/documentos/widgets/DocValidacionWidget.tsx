/**
 * DocValidacionWidget — Checklist de documentos requeridos por trámite
 * ARCHIVO → src/artifacts/documentos/widgets/DocValidacionWidget.tsx
 *
 * Ambos roles la ven, pero con perspectiva diferente:
 *   Productor → qué tiene y qué le falta en su expediente
 *   Unión     → qué mandó el productor y si está completo
 */

import { useState } from 'react'
import { useUser }  from '../../../context/UserContext'
import { useRanchoId } from '../../../hooks/useAnimales'
import {
  useExpedientes,
  useExpedienteDocumentos,
  evaluarCompletitud,
  TRAMITE_LABEL,
  TRAMITE_COLOR,
  REQUISITOS_TRAMITE,
  DOC_TIPO_LABEL,
  DOC_TIPO_COLOR,
  type ExpedienteDB,
} from '../../../hooks/useDocumentos'

function isUnion(role: string | null) {
  return role === 'union' || role === 'union_ganadera'
}

export default function DocValidacionWidget() {
  const { profile, role } = useUser()
  const userId            = profile?.user_id ?? null
  const { ranchoId }      = useRanchoId(userId)

  const { expedientes, loading } = useExpedientes(isUnion(role) ? null : ranchoId)
  const [seleccionado, setSeleccionado] = useState<ExpedienteDB | null>(null)

  const { documentos, loading: loadingDocs } = useExpedienteDocumentos(seleccionado?.id ?? null)

  const completitud = seleccionado
    ? evaluarCompletitud(seleccionado.tipo_tramite, documentos)
    : null

  const requisitos = seleccionado ? REQUISITOS_TRAMITE[seleccionado.tipo_tramite] : []

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-4 h-4 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col gap-4">

      <div>
        <p className="text-[13px] font-semibold text-stone-700 dark:text-stone-200">Validación</p>
        <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
          Revisa qué documentos tienes y qué te falta para tu trámite
        </p>
      </div>

      {/* Selector de expediente */}
      {!seleccionado ? (
        expedientes.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center">
              <svg className="w-5 h-5 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <p className="text-[12px] text-stone-400 dark:text-stone-500">Sin expedientes activos</p>
            <p className="text-[11px] text-stone-300 dark:text-stone-600 max-w-48 leading-relaxed">
              Crea un expediente en la pestaña "Subida" para validar documentos
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
              Selecciona un expediente
            </p>
            {expedientes.map(exp => (
              <button
                key={exp.id}
                onClick={() => setSeleccionado(exp)}
                className="flex items-center gap-3 p-3.5 rounded-[10px] border border-stone-200/70 dark:border-stone-800 bg-white dark:bg-[#1c1917] hover:border-[#2FAF8F]/40 hover:shadow-sm transition-all text-left cursor-pointer w-full"
              >
                <div
                  className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0"
                  style={{ background: `${TRAMITE_COLOR[exp.tipo_tramite]}18` }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: TRAMITE_COLOR[exp.tipo_tramite] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold text-stone-700 dark:text-stone-200 truncate">{exp.titulo}</p>
                  <p className="text-[10.5px] text-stone-400 dark:text-stone-500">{TRAMITE_LABEL[exp.tipo_tramite]}</p>
                </div>
                <svg className="w-3.5 h-3.5 text-stone-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col gap-4">

          {/* Back */}
          <button
            onClick={() => setSeleccionado(null)}
            className="flex items-center gap-1.5 text-[12px] text-stone-400 hover:text-stone-600 transition-colors bg-transparent border-0 cursor-pointer w-fit"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 19 8 12 15 5"/>
            </svg>
            {seleccionado.titulo}
          </button>

          {loadingDocs ? (
            <div className="flex justify-center py-8">
              <div className="w-4 h-4 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Barra de progreso */}
              {completitud && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11.5px] font-semibold text-stone-600 dark:text-stone-300">
                      Completitud del expediente
                    </p>
                    <span
                      className="text-[12px] font-bold"
                      style={{ color: completitud.porcentaje >= 80 ? '#2FAF8F' : completitud.porcentaje >= 50 ? '#f59e0b' : '#ef4444' }}
                    >
                      {completitud.porcentaje}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${completitud.porcentaje}%`,
                        background: completitud.porcentaje >= 80 ? '#2FAF8F' : completitud.porcentaje >= 50 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                  {completitud.tieneObligatorios ? (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <p className="text-[11px] text-[#2FAF8F]">Todos los documentos obligatorios presentes</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <p className="text-[11px] text-amber-600 dark:text-amber-400">
                        Faltan {completitud.faltantes.length} documento{completitud.faltantes.length !== 1 ? 's' : ''} obligatorio{completitud.faltantes.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Lista de requisitos */}
              {requisitos.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                    Checklist — {TRAMITE_LABEL[seleccionado.tipo_tramite]}
                  </p>
                  {requisitos.map(req => {
                    const tieneDoc = documentos.some(d => d.tipo === req.tipo)
                    return (
                      <div
                        key={req.tipo}
                        className={`flex items-center gap-3 p-2.5 rounded-[8px] transition-colors ${
                          tieneDoc
                            ? 'bg-[#2FAF8F]/06 dark:bg-[#2FAF8F]/08'
                            : req.obligatorio
                              ? 'bg-red-50/60 dark:bg-red-950/20'
                              : 'bg-stone-50 dark:bg-stone-900/30'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          tieneDoc
                            ? 'bg-[#2FAF8F]'
                            : req.obligatorio
                              ? 'bg-red-100 dark:bg-red-950/50 border-2 border-red-300 dark:border-red-800'
                              : 'bg-stone-100 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700'
                        }`}>
                          {tieneDoc && (
                            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[12px] font-medium ${
                            tieneDoc
                              ? 'text-stone-700 dark:text-stone-200'
                              : 'text-stone-500 dark:text-stone-400'
                          }`}>
                            {req.label}
                          </p>
                          {!tieneDoc && req.obligatorio && (
                            <p className="text-[10px] text-red-500 mt-0.5">Obligatorio</p>
                          )}
                        </div>
                        {tieneDoc && (
                          <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded ${DOC_TIPO_COLOR[req.tipo] ?? 'text-stone-400 bg-stone-100'}`}>
                            ✓ {DOC_TIPO_LABEL[req.tipo] ?? req.tipo}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Documentos fuera de requisitos */}
              {documentos.filter(d => !requisitos.some(r => r.tipo === d.tipo)).length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                    Documentos adicionales
                  </p>
                  {documentos
                    .filter(d => !requisitos.some(r => r.tipo === d.tipo))
                    .map(doc => (
                      <div key={doc.id} className="flex items-center gap-2 p-2.5 rounded-[8px] bg-stone-50 dark:bg-stone-900/30">
                        <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${DOC_TIPO_COLOR[doc.tipo] ?? 'text-stone-400 bg-stone-100'}`}>
                          {DOC_TIPO_LABEL[doc.tipo] ?? doc.tipo}
                        </span>
                        <p className="text-[11.5px] text-stone-500 dark:text-stone-400 truncate">{doc.nombre}</p>
                      </div>
                    ))}
                </div>
              )}

              {/* Sin documentos */}
              {documentos.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <p className="text-[12px] text-stone-400 dark:text-stone-500">Sin documentos en este expediente</p>
                  <p className="text-[11px] text-stone-300 dark:text-stone-600">Usa "Subida" para añadir documentos</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}