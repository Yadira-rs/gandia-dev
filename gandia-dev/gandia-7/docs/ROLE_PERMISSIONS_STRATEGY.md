# ESTRATEGIA DE PERMISOS POR ROL - GANDIA 7

## RESUMEN EJECUTIVO

Tu requerimiento es:
- **Chat, Noticias, Historial, Verificación** → SIEMPRE visibles para todos los roles
- **Fichas, Gemelos, Monitoreo, Certificación, Trámites** → Visibles según el rol, pero accesibles también via Chat
- **No crear artefactos por rol** → Usar el Chat como interfaz universal

---

## 1. ARQUITECTURA ACTUAL

### Roles existentes (`src/lib/authService.ts`):
```typescript
export type UserRole = 'producer' | 'mvz' | 'union' | 'exporter' | 'auditor'
```

### Context disponible (`src/context/UserContext.tsx`):
```typescript
const { profile, role } = useUser()
// role ya contiene: 'producer' | 'mvz' | 'union' | 'exporter' | 'auditor' | null
```

### Navegación actual (`src/layout/AppLayout.tsx`):
```typescript
const NAV_GROUPS = [
  {
    label: 'Principal',
    items: [
      { label: 'Chat', path: '/chat', icon: 'chat' },
      { label: 'Noticias', path: '/noticias', icon: 'newspaper' },
      { label: 'Fichas', path: '/chat?open=passport', icon: 'file' },
      { label: 'Gemelos', path: '/chat?open=twins', icon: 'copy' },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { label: 'Monitoreo', path: '/chat?open=monitoring', icon: 'eye' },
      { label: 'Certificación', path: '/chat?open=certification', icon: 'check-circle' },
      { label: 'Trámites', path: '/tramites', icon: 'tramites' },
      { label: 'Verificación', path: '/chat?open=verification', icon: 'verified' },
    ],
  },
]
```

---

## 2. ESTRATEGIA RECOMENDADA

### FILOSOFÍA: "Chat como Interfaz Universal"

```
┌─────────────────────────────────────────────────────────────────┐
│              NAVEGACIÓN VISIBLE SEGÚN ROL                      │
├─────────────────────────────────────────────────────────────────┤
│  ✓ Chat        → SIEMPRE (universal)                           │
│  ✓ Noticias    → SIEMPRE                                       │
│  ✓ Historial   → SIEMPRE                                       │
│  ✓ Verificación→ SIEMPRE                                       │
│                                                                 │
│  ? Fichas      → Según rol + via Chat                          │
│  ? Gemelos     → Según rol + via Chat                          │
│  ? Monitoreo   → Según rol + via Chat                          │
│  ? Certificación→ Según rol + via Chat                         │
│  ? Trámites    → Según rol + via Chat                          │
└─────────────────────────────────────────────────────────────────┘
```

### Por qué funciona:
1. El Chat ya tiene `intentDetector` que detecta lo que el usuario necesita
2. El usuario puede pedir "ver mi hato", "mostrar gemelos", "dame el monitoreo"
3. **NO necesitas crear artefactos por rol** - el Chat es el "artefacto universal"

---

## 3. IMPLEMENTACIÓN REQUERIDA

### ARCHIVO 1: Crear `src/config/rolePermissions.ts`

```typescript
/**
 * rolePermissions.ts
 * Configuración de permisos por rol para la navegación.
 */

import type { UserRole } from '../lib/authService'

// ─────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────

export interface RoleNavPermissions {
  showFichas: boolean        // passport - Fichas Ganaderas
  showGemelos: boolean       // twins - Gemelo Digital
  showMonitoreo: boolean     // monitoring - Monitoreo y Sensores
  showCertificacion: boolean // certification - Certificaciones
  showTramites: boolean      // tramites - Trámites SENASICA
  showVerificacion: boolean  // verification - Verificaciones y Auditorías
}

// ─────────────────────────────────────────────────────────────────
// PERMISOS POR ROL
// ─────────────────────────────────────────────────────────────────

export const ROLE_NAV_PERMISSIONS: Record<UserRole, RoleNavPermissions> = {
  producer: {
    showFichas: true,
    showGemelos: true,
    showMonitoreo: true,
    showCertificacion: true,
    showTramites: true,
    showVerificacion: true,
  },
  mvz: {
    showFichas: true,
    showGemelos: false,       // Accede via Chat
    showMonitoreo: true,
    showCertificacion: true,
    showTramites: false,      // No gestiona trámites
    showVerificacion: true,
  },
  union: {
    showFichas: true,
    showGemelos: false,       // No necesita gemelos
    showMonitoreo: false,     // No monitorea ranchos
    showCertificacion: true,
    showTramites: true,
    showVerificacion: true,
  },
  exporter: {
    showFichas: true,         // Necesita ver fichas para comprar
    showGemelos: true,        // Necesita gemelos para trazabilidad
    showMonitoreo: false,     // No monitorea
    showCertificacion: true,  // Necesita certificaciones
    showTramites: false,      // Los trámites los hace la unión
    showVerificacion: true,
  },
  auditor: {
    showFichas: false,        // Verifica, no gestiona fichas
    showGemelos: true,        // Necesita trazabilidad
    showMonitoreo: true,      // Necesita monitorear
    showCertificacion: true,  // Necesita verificar certificaciones
    showTramites: true,       // Necesita ver trámites
    showVerificacion: true,
  },
}

// ─────────────────────────────────────────────────────────────────
// ITEMS GLOBALES (siempre visibles)
// ─────────────────────────────────────────────────────────────────

export const GLOBAL_NAV_ITEMS = [
  { label: 'Chat', path: '/chat', icon: 'chat' as const },
  { label: 'Noticias', path: '/noticias', icon: 'newspaper' as const },
  { label: 'Historial', path: '/historial', icon: 'clock' as const },
] as const

// ─────────────────────────────────────────────────────────────────
// NAV ITEMS CONFIGURABLES
// ─────────────────────────────────────────────────────────────────

export const NAV_ITEM_CONFIGS = [
  { label: 'Fichas', path: '/chat?open=passport', icon: 'file', domain: 'showFichas' },
  { label: 'Gemelos', path: '/chat?open=twins', icon: 'copy', domain: 'showGemelos' },
  { label: 'Monitoreo', path: '/chat?open=monitoring', icon: 'eye', domain: 'showMonitoreo' },
  { label: 'Certificación', path: '/chat?open=certification', icon: 'check-circle', domain: 'showCertificacion' },
  { label: 'Trámites', path: '/tramites', icon: 'tramites', domain: 'showTramites' },
  { label: 'Verificación', path: '/chat?open=verification', icon: 'verified', domain: 'showVerificacion' },
]

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

export function getRolePermissions(role: UserRole | null | string): RoleNavPermissions {
  if (!role) {
    return {
      showFichas: false,
      showGemelos: false,
      showMonitoreo: false,
      showCertificacion: false,
      showTramites: false,
      showVerificacion: false,
    }
  }
  
  return ROLE_NAV_PERMISSIONS[role as UserRole] ?? {
    showFichas: false,
    showGemelos: false,
    showMonitoreo: false,
    showCertificacion: false,
    showTramites: false,
    showVerificacion: false,
  }
}

export function buildNavGroups(role: UserRole | null | string) {
  const permissions = getRolePermissions(role)
  
  return [
    {
      label: 'Principal',
      items: [
        ...GLOBAL_NAV_ITEMS,
        ...NAV_ITEM_CONFIGS.filter(item => item.domain === 'showFichas' && permissions.showFichas),
        ...NAV_ITEM_CONFIGS.filter(item => item.domain === 'showGemelos' && permissions.showGemelos),
      ],
    },
    {
      label: 'Operaciones',
      items: [
        ...NAV_ITEM_CONFIGS.filter(item => item.domain === 'showMonitoreo' && permissions.showMonitoreo),
        ...NAV_ITEM_CONFIGS.filter(item => item.domain === 'showCertificacion' && permissions.showCertificacion),
        ...NAV_ITEM_CONFIGS.filter(item => item.domain === 'showTramites' && permissions.showTramites),
        // Verificación siempre visible
        ...NAV_ITEM_CONFIGS.filter(item => item.domain === 'showVerificacion'),
      ],
    },
  ].filter(grupo => grupo.items.length > 0)
}
```

---

### ARCHIVO 2: Modificar `src/layout/AppLayout.tsx`

**Cambio 1: Importar el módulo de permisos**

Al inicio del archivo, agregar:
```typescript
import { buildNavGroups, GLOBAL_NAV_ITEMS, NAV_ITEM_CONFIGS, getRolePermissions } from '../config/rolePermissions'
```

**Cambio 2: Modificar el render de NAV_GROUPS**

Buscar la constante NAV_GROUPS y su uso, reemplazarla con:

```typescript
// Obtener permisos según el rol del usuario
const navGroups = buildNavGroups(roleCode)
```

**Cambio 3: Usar los grupos dinámicos**

Buscar donde se renderiza `NAV_GROUPS.map` y cambiar a `navGroups.map`:
```typescript
{navGroups.map((g) => (
  <NavGroup
    key={g.label}
    label={g.label}
    items={g.items}
    collapsed={sidebarCollapsed}
    isActive={isActive}
    onNav={handleNav}
  />
))}
```

---

## 4. TABLA DE PERMISOS POR ROL

| Módulo | Producer | MVZ | Unión | Exportador | Auditor |
|--------|----------|-----|-------|------------|---------|
| **Chat** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Noticias** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Historial** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Verificación** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Fichas** | ✓ | ✓ | ✓ | ✓ | ✗ |
| **Gemelos** | ✓ | ✗ | ✗ | ✓ | ✓ |
| **Monitoreo** | ✓ | ✓ | ✗ | ✗ | ✓ |
| **Certificación** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Trámites** | ✓ | ✗ | ✓ | ✗ | ✓ |

---

## 5. ACCESO VIA CHAT (universal)

Cuando un usuario con rol que no tiene acceso a un módulo en el sidebar intenta acceder via Chat, el sistema mostrará el widget igual. Esto es porque el Chat funciona como "puerta universal".

**Ejemplo de comportamiento:**

| Rol | Solicita en Chat | Resultado |
|-----|------------------|-----------|
| **Auditor** | "Ver mis fichas" | Se muestra el widget de Fichas |
| **MVZ** | "Mostrar gemelos" | Se muestra el widget de Gemelos |
| **Exportador** | "Ver monitoreo" | Se muestra el widget de Monitoreo |

Esto significa que **NO necesitas modificar el intentDetector** - el Chat siempre permitirá acceso a todos los dominios, pero el sidebar estará filtrado según el rol.

---

## 6. RESUMEN DE ARCHIVOS A MODIFICAR

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/config/rolePermissions.ts` | **CREAR** | Nuevo archivo con configuración de permisos |
| `src/layout/AppLayout.tsx` | **MODIFICAR** | Importar y usar buildNavGroups para filtrar navegación |

---

## 7. NOTAS IMPORTANTES

1. **El Chat es tu amigo**: Ya tienes todo implementado para que el Chat detecte lo que el usuario necesita. No necesitas crear artefactos por rol.

2. **Sidebar filtrado + Chat universal**: Los usuarios ven solo lo que pueden navegar directamente, pero pueden acceder a TODO via Chat.

3. **El rol viene del contexto**: `useUser()` ya te da `role` que puedes usar en cualquier momento.

4. **Fácil de mantener**: Solo necesitas modificar `rolePermissions.ts` para cambiar permisos por rol en el futuro.

---

*Documento generado para Gandia 7 - Sistema de Gestión Ganadera*

