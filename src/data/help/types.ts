export interface HelpArticle {
  id: string
  title: string
  category: 'getting-started' | 'features' | 'troubleshooting' | 'api-costs' | 'advanced'
  tags: string[]
  content: string
  relatedArticles?: string[]
}

export interface HelpCategory {
  id: string
  name: string
  icon: string
}