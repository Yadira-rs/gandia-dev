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

## Módulos que funcionarán automáticamente:
- ✅ **Subida** (ya tiene tipos cert)
- ✅ **Expedientes** (nuevo filtro) 
- ✅ **Validación** (ve docs filtrados)
- ✅ **Revisión** (todos los módulos usan mismo hook)
- ✅ **Empaque** (mismo data source)

**TODO está listo para PRODUCCIÓN con este cambio.**

¡Hazlo ya! 👍


