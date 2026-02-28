import type { CollectionConfig } from 'payload'

const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt', 'featured'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL amigable (ej: trazabilidad-digital-futuro-ganaderia)',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }: any) => {
            // ← Agregar `: any` temporal
            if (!value && data?.title) {
              return data.title
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Resumen corto del artículo',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'readTime',
      type: 'text',
      required: true,
      defaultValue: '5 min',
      admin: {
        description: 'Tiempo estimado de lectura',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories' as any, // ← Agregar `as any` temporal
      required: true,
      hasMany: false,
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'authors' as any, // ← Agregar `as any` temporal
      required: true,
      hasMany: false,
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
    {
      name: 'seoMetaTitle',
      type: 'text',
    },
    {
      name: 'seoMetaDescription',
      type: 'textarea',
    },
  ],
}

export default Posts
