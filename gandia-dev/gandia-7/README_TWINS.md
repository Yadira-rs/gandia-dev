# 📖 Guía TWINS - Gemelo Digital (¡Ya eres TWINS oficial! 🐮✨)

¡Bienvenido compañero! Ya eres el **TWINS oficial** 🎉. Este módulo maneja el **Gemelo Digital** de los animales: timeline, peso, alimentación, perfiles gemelos, etc.

**FICHAS ya están 100% funcionales con la DB** (Supabase). TWINS debe **interconectarse** con ellas vía ID del animal (SINIIGA/arete).

> **📊 NOTA IMPORTANTE**: Te voy a pasar un CSV con todos los datos de la base de datos para pruebas y desarrollo.

## 🎯 ¿Qué es TWINS?
- **Gemelo Digital**: Historial completo del animal (no solo ficha estática).
- Widgets inline en chat + Módulos split + Ánima fullscreen.
- Datos: timeline eventos, curvas peso, raciones alimentación, métricas IA.

## 🗂️ Estructura del Proyecto (Solo lo que usas)

```
src/
├── lib/supabaseClient.ts          # Cliente DB (¡ÚSALA SIEMPRE!)
├── hooks/useAnimales.ts           # Hook fichas (¡IMPORTANTE para integración!)
├── artifacts/
│   ├── artifactTypes.ts           # Define 'twins' domain/widgets
│   ├── Ficha/                     # FICHAS 100% listas ✅
│   └── twins/                     # ¡TU ÁREA!
│       ├── GemelosAnima.tsx       # Pantalla completa (awakes módulos)
│       ├── GemelosModulo.tsx      # Panel lateral (tu principal)
│       └── widgets/
│           ├── TwinsTimelineWidget.tsx  # Línea de tiempo
│           ├── TwinsFeedWidget.tsx      # Feed eventos
│           ├── TwinsAlimentacionWidget.tsx # Alimentación
│           ├── TwinsPerfilesWidget.tsx   # Perfiles gemelo
│           ├── TwinsPesoWidget.tsx       # Curva peso
│           └── TwinsHeroWidget.tsx       # Hero principal
├── pages/Chat/artifactEngine/     # Donde se renderiza TODO
└── supabase/                      # Funciones Edge (si necesitas)
```

## 🔌 Integración con FICHAS (Obligatorio)
1. **Animal ID compartido**: Usa `animal_id` o `arete` de Ficha.
2. **Hook base**: `useAnimales()` trae fichas desde Supabase.
3. **Queries Supabase**:
   ```ts
   // Ejemplo en tu widget
   import { supabase } from '@/lib/supabaseClient';
   import { useAnimales } from '@/hooks/useAnimales';

   const { animales } = useAnimales(); // Fichas listas

   // Twins data por animal
   const { data: twinsData } = await supabase
     .from('twins_eventos')  // ¡CREA esta tabla!
     .select('*')
     .eq('animal_id', animal.arete);
   ```

**Tablas DB a usar/crear**:
- `animales` (ya existe, de Fichas)
- `twins_eventos` (crea: id, animal_id, tipo, fecha, data JSON)
- `twins_pesos` (crea: id, animal_id, peso, fecha)
- `twins_alimentacion` (crea: id, animal_id, racion, fecha)

## 🚀 Lo que DEBES CREAR/COMPLETAR (Paso a paso)

### 1. **DB Schema** (Supabase Dashboard o migración)
```
Tabla: twins_eventos
- id: uuid (pk)
- animal_id: text (FK animales.arete)
- tipo: text (peso|evento|alimentacion)
- fecha: timestamptz
- data: jsonb (peso: {kg: 450}, evento: {desc: 'Vacunado'})

Tabla: twins_pesos (similar)
Tabla: twins_alimentacion (similar)
```

### 2. **Hooks TWINS** (Crea en src/hooks/)
```
useTwins.ts          # useQuery todos twins de animal
useTwinsEvento.ts    # CRUD eventos
useTwinsPeso.ts      # CRUD pesos
```

### 3. **COMPLETAR Widgets** (Ya tienen scaffold)
- `TwinsTimelineWidget.tsx`: Lista eventos cronológicos.
- `TwinsFeedWidget.tsx`: Eventos recientes.
- `TwinsPesoWidget.tsx`: Gráfico curva peso (usa Chart lib).
- `TwinsAlimentacionWidget.tsx`: Tabla raciones.
- `TwinsPerfilesWidget.tsx`: KPIs gemelo (edad virtual, crecimiento).
- `TwinsHeroWidget.tsx`: Resumen principal.

**Patrón Widget** (copia de Ficha):
```tsx
import { WidgetArtifactId } from '../artifactTypes';

interface Props { id: WidgetArtifactId; data?: any; }

export const TwinsTimelineWidget = ({ data }: Props) => {
  // useQuery twins_eventos orden fecha DESC
  return <div>Tu timeline aquí</div>;
};
```

### 4. **GemelosModulo.tsx** (Ya existe, completa)
- Grid con todos tus widgets.
- Recibe `data.animal_id` de Ficha.

### 5. **GemelosAnima.tsx** (Pantalla full)
```
awakes: ['twins:historial', 'twins:alimentacion']
```
- Layout con Copiloto flotante.
- Barra superior: Volver a chat.

### 6. **Integrar en artifactTypes.ts**
Ya definido:
```
'twins:timeline' → twins:historial (timeline + feed)
'twins:alimentacion' → twins:alimentacion
```
Prueba intents: "historial del gemelo", "peso del animal".

### 7. **Testing**
```
npm run dev
Chat: "muéstrame el gemelo de [arete]"
Ver: Widgets → Módulo → Ánima
```

## ⚠️ Reglas estrictas
- **NO toques Fichas** (ya perfectas).
- **Siempre** filtra por `animal_id` de Ficha.
- Usa **exacto** patrón de otros artifacts (Ficha/Biometria).
- **Hooks** para queries (no inline supabase).
- Commit pequeño: 1 widget por PR.

## 🎁 Bonus: Datos de prueba
Inserta en `twins_eventos`:
```
animal_id: 'ARETE123', tipo: 'peso', fecha: '2024-01-01', data: {kg: 300}
animal_id: 'ARETE123', tipo: 'evento', fecha: '2024-02-01', data: {desc: 'Vacunación'}
```

¡Éxito gemelo! 🐄💻 Cuando termines: npm run dev → Chat → "gemelo timeline" → ¡Mágico! 

Pregúntame si atoras 🚀

