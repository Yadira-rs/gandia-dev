// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  publishedAt: string
  readTime: string
  category: 'trazabilidad' | 'normativa' | 'tecnologia' | 'casos-exito' | 'guias'
  author: { name: string; role: string; bio?: string }
  coverImage?: string
  featured?: boolean
  tags?: string[]
  seoMetaTitle?: string
  seoMetaDescription?: string
}

interface PayloadResponse {
  docs: PayloadPost[]
}

interface PayloadPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: PayloadRichText | string
  publishedAt: string
  readTime: string
  category: string | PayloadCategory
  author: string | PayloadAuthor
  coverImage?: string | PayloadMedia
  featured?: boolean
  tags?: Array<{ tag: string }>
  seoMetaTitle?: string
  seoMetaDescription?: string
}

interface PayloadCategory {
  slug: string
}

interface PayloadAuthor {
  name: string
  role: string
  bio?: string
}

interface PayloadMedia {
  url: string
}

interface PayloadRichText {
  root: {
    children: PayloadNode[]
  }
}

interface PayloadNode {
  type: string
  tag?: string
  children?: PayloadNode[]
  text?: string
  format?: number
}

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────
const PAYLOAD_URL = import.meta.env.VITE_PAYLOAD_URL || 'http://localhost:3000'

export async function fetchPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${PAYLOAD_URL}/api/posts?depth=2&limit=100`)
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    
    const data: PayloadResponse = await res.json()
    
    return data.docs.map(post => mapPayloadPost(post))
  } catch (error) {
    console.error('Error fetching posts:', error)
    return []
  }
}

export async function fetchPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(
      `${PAYLOAD_URL}/api/posts?where[slug][equals]=${slug}&depth=2&limit=1`
    )
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    
    const data: PayloadResponse = await res.json()
    
    if (!data.docs || data.docs.length === 0) {
      return null
    }
    
    return mapPayloadPost(data.docs[0])
  } catch (error) {
    console.error('Error fetching post:', error)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAPPERS
// ─────────────────────────────────────────────────────────────────────────────
function mapPayloadPost(post: PayloadPost): BlogPost {
  const tags = post.tags?.map(t => t.tag).filter(Boolean) || []
  
  let coverImage: string | undefined
  if (post.coverImage) {
    if (typeof post.coverImage === 'string') {
      coverImage = `${PAYLOAD_URL}${post.coverImage}`
    } else if (post.coverImage.url) {
      coverImage = `${PAYLOAD_URL}${post.coverImage.url}`
    }
  }
  
  let categorySlug: BlogPost['category'] = 'trazabilidad'
  if (post.category) {
    if (typeof post.category === 'string') {
      categorySlug = post.category as BlogPost['category']
    } else if (post.category.slug) {
      categorySlug = post.category.slug as BlogPost['category']
    }
  }
  
  const author = {
    name: typeof post.author === 'object' ? post.author.name : 'Autor desconocido',
    role: typeof post.author === 'object' ? post.author.role : '',
    bio: typeof post.author === 'object' ? post.author.bio : undefined,
  }
  
  let content = ''
  if (post.content) {
    content = extractTextFromRichText(post.content)
  }
  
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content,
    publishedAt: post.publishedAt,
    readTime: post.readTime || '5 min',
    category: categorySlug,
    author,
    coverImage,
    featured: post.featured || false,
    tags,
    seoMetaTitle: post.seoMetaTitle,
    seoMetaDescription: post.seoMetaDescription,
  }
}

function extractTextFromRichText(richText: PayloadRichText | string): string {
  if (typeof richText === 'string') return richText
  
  if (!richText || !richText.root || !richText.root.children) {
    return ''
  }
  
  const blocks: string[] = []
  
  richText.root.children.forEach(node => {
    if (node.type === 'heading') {
      const text = extractTextFromNode(node)
      const level = node.tag === 'h2' ? '## ' : '### '
      blocks.push(level + text)
    } else if (node.type === 'paragraph') {
      const text = extractTextFromNode(node)
      blocks.push(text)
    } else if (node.type === 'quote') {
      const text = extractTextFromNode(node)
      blocks.push('> ' + text)
    } else if (node.type === 'list') {
      const items = node.children?.map(item => {
        const text = extractTextFromNode(item)
        return '- ' + text
      }).join('\n') || ''
      blocks.push(items)
    }
  })
  
  return blocks.join('\n\n')
}

function extractTextFromNode(node: PayloadNode): string {
  if (!node || !node.children) return ''
  
  return node.children.map(child => {
    if (child.type === 'text') {
      let text = child.text || ''
      if (child.format && child.format & 1) {
        text = `**${text}**`
      }
      return text
    } else if (child.children) {
      return extractTextFromNode(child)
    }
    return ''
  }).join('')
}