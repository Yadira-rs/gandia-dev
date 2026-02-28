import type { CollectionConfig } from 'payload'

const Authors: CollectionConfig = {
  slug: 'authors',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'role'],
  },
  access: {
    read: () => true, // público
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'text',
      required: true,
      admin: {
        description: 'Ej: Directora de Operaciones, MVZ & Tech Lead',
      },
    },
    {
      name: 'bio',
      type: 'textarea',
      admin: {
        description: 'Biografía del autor (opcional)',
      },
    },
  ],
}

export default Authors
