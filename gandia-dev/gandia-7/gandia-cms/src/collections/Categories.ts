import type { CollectionConfig } from 'payload'

const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'slug', 'color'],
  },
  access: {
    read: () => true, // público
  },
  fields: [
    {
      name: 'slug',
      type: 'select',
      required: true,
      unique: true,
      options: [
        { label: 'Trazabilidad', value: 'trazabilidad' },
        { label: 'Normativa', value: 'normativa' },
        { label: 'Tecnología', value: 'tecnologia' },
        { label: 'Casos de Éxito', value: 'casos-exito' },
        { label: 'Guías', value: 'guias' },
      ],
    },
    {
      name: 'label',
      type: 'text',
      required: true,
    },
    {
      name: 'color',
      type: 'text',
      required: true,
      admin: {
        description: 'Color hexadecimal (ej: #1A9E7A)',
      },
    },
    {
      name: 'bg',
      type: 'text',
      required: true,
      admin: {
        description: 'Color de fondo hexadecimal (ej: #E8F8F3)',
      },
    },
  ],
}

export default Categories
