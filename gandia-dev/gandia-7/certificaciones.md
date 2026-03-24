# Instrucciones para Módulo de Certificaciones

Hola compañero,

## Estado actual ✅
- **Ya existe** la opción de clasificación por tipo de documento (incluyendo `certificado_sanitario`) en **DocSubidaWidget.tsx**.
- Los documentos se guardan en tabla `expediente_documentos` con campo `tipo: TipoDocExpediente`.

## Tarea: Filtrar certificaciones en Expedientes

**Archivo objetivo:** `src/artifacts/documentos/widgets/DocExpedienteWidget.tsx`

### 1. Agregar filtro "Certificaciones" (igual que ESTADOS_FILTRO)

**Busca esta sección (línea ~45):**
```tsx
const ESTADOS_FILTRO: { value: EstadoExpediente | 'todos'; label: string }[] = [
```

**Agrega DESPUÉS:**
```tsx
const CERTIFICACIONES_FILTRO: { value: 'certificado_sanitario' | 'constancia_upp' | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos los certificados' },
  { value: 'certificado_sanitario', label: 'Certificado sanitario' },
  { value: 'constancia_upp', label: 'Constancia UPP' },
]
```

### 2. Nuevo estado para filtro de certificaciones
**Agrega después de `const [filtroEstado, setFiltroEstado]`:**
```tsx
const [filtroCert, setFiltroCert] = useState<'todos' | TipoDocExpediente>('todos')
```

### 3. Botón de pestañas "Certificaciones" 
**En la vista de documentos (busca `if (seleccionado)` ~línea 120, después del header):**
```tsx
{/* Filtros de certificaciones */}
<div className="flex gap-1.5 flex-wrap mt-3">
  {CERTIFICACIONES_FILTRO.map(f => (
    <button
      key={f.value}
      onClick={() => setFiltroCert(f.value)}
      className={`px-2.5 py-1 rounded-full text-[10.5px] font-medium transition-all border-0 cursor-pointer ${
        filtroCert === f.value
          ? 'bg-[#2FAF8F] text-white'
          : 'bg-stone-100 dark:bg-stone-800/60 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
      }`}
    >
      {f.label}
    </button>
  ))}
</div>
```

### 4. Filtrar documentos
**Busca `const { documentos, ... } = useExpedienteDocumentos` y reemplaza el map por:**

```tsx
const documentosFiltrados = documentos.filter(doc => {
  const matchCert = filtroCert === 'todos' || doc.tipo === filtroCert
  return matchCert
})

{/* Reemplaza {documentos.map...} por */}
{documentosFiltrados.map((doc: ExpedienteDocumentoDB) => (
```

### 5. Actualizar contador
**Busca `{documentos.length} documento` y cambia por:**
```tsx
{documentosFiltrados.length} documento{documentosFiltrados.length !== 1 ? 's' : ''}
```

## Tipos de certificación válidos (de useDocumentos.ts):
- `certificado_sanitario`
- `constancia_upp` 
- `resultado_lab`
- `vacunacion`

## PASO EXTRA: Revisar Base de Datos (PRODUCCIÓN)

**IMPORTANTE:** Antes de codear, revisa el estado actual de la DB en Supabase:

```
https://app.supabase.com/project/[tu-project]/editor?table=expediente_documentos
```

**Ejecuta esta query para ver certificados existentes:**
```sql
SELECT id, nombre, tipo, emisor, fecha_documento, created_at 
FROM expediente_documentos 
WHERE tipo IN ('certificado_sanitario', 'constancia_upp', 'resultado_lab', 'vacunacion')
ORDER BY created_at DESC;
```

**Verifica también expedientes de certificación:**
```sql
SELECT id, titulo, rancho_id, estado 
FROM expedientes 
WHERE tipo_tramite = 'certificacion';
```

## 🚀 DESPLIEGUE A PRODUCCIÓN

Después de implementar:

1. **Test local:** Sube docs con tipo certificación → verifica filtro
2. **Commit:** `git add . && git commit -m "feat: filtro certificaciones en expedientes"`
3. **Push:** `git push origin main`
4. **Vercel/Netlify:** Deploy automático
5. **Supabase:** Ya funciona con datos existentes

## 🚨 IMPLEMENTAR MÓDULOS COMPLETOS DE CERTIFICACIONES (REAL, NO SIMULADO)

**El filtro en Expedientes es el NÚCLEO. Ahora agrega tabs específicas para certificaciones en el sistema completo:**

### 1. **DocumentosModulo.tsx & DocumentosAnima.tsx** 
**Agrega tab "Certificaciones" DESPUÉS de 'expedientes':**
```tsx
// En TABS_PRODUCTOR y TABS_UNION
{ id: 'certificaciones', label: 'Certificaciones' },
```

**Renderiza DocExpedienteWidget con filtro auto-cert:**
```tsx
{ tab === 'certificaciones' && <DocExpedienteWidget filtroCert="certificado_sanitario" /> }
```

**Pasa prop `filtroCert?: string` a DocExpedienteWidget.**

### 2. **tramitesPanel.tsx** (Unión Ganadera)
**Agrega en bandeja de municipios: filtro "Solo certificaciones":**
```tsx
// Query con WHERE tipo_tramite = 'certificacion'
const tramitesCert = tramites.filter(t => t.tipo === 'certificacion')
```

**Nueva vista "Certificaciones" similar a municipios/bandeja.**

### 3. **NUEVAS FUNCIONALIDADES REALES:**

**a) Perfiles (DocPanelGeneralWidget.tsx)**
Filtrar productores SOLO con certificaciones pendientes:
```tsx
const productoresCert = grupos.filter(g => g.expedientes.some(e => 
  e.tipo_tramite === 'certificacion' && 
  e.estado === 'en_revision'
))
```

**b) Elegibilidad** 
En checklist de tramitesPanel: item "Certificaciones vigentes" → query DB real.

**c) Checklist** 
Agregar "Certificado sanitario vigente" → validar fecha_documento vs hoy.

**d) Vencimientos** 
Nueva columna en bandeja:
```tsx
const vencidos = docs.filter(d => 
  d.tipo === 'certificado_sanitario' && 
  new Date(d.fecha_documento) < new Date()
)
```

### 4. **BASE DE DATOS REAL** (NO SIMULAR)
**Migración inmediata:**
```sql
-- Agregar campo es_certificacion a expediente_documentos
ALTER TABLE expediente_documentos ADD COLUMN es_certificacion boolean DEFAULT false;

-- Marcar existentes
UPDATE expediente_documentos 
SET es_certificacion = true 
WHERE tipo IN ('certificado_sanitario','constancia_upp');

-- Query vencimientos
SELECT * FROM expediente_documentos 
WHERE es_certificacion AND fecha_documento < CURRENT_DATE;
```

## ✅ VERIFICACIÓN PRODUCCIÓN REAL:
```
1. Sube certificado → aparece en tab Certificaciones
2. tramitesPanel filtra solo tipo='certificacion'  
3. PanelGeneral solo productores con cert pendientes
4. Checklist valida cert vigentes (query DB)
5. Alertas vencimientos (query fecha_documento)
6. TODO con datos REALES de Supabase PROD
```

**NO SIMULES NADA. Usa queries SQL reales arriba. Todo debe funcionar con datos de producción YA.**

¡IMPLEMENTA COMPLETO HOY! 🔥


