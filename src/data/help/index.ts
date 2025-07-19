import { HelpArticle, HelpCategory } from './types'
import { gettingStartedArticles } from './gettingStarted'
import { featuresArticles } from './features'
import { troubleshootingArticles } from './troubleshooting'
import { apiCostsArticles } from './apiCosts'
import { advancedArticles } from './advanced'

// Combine all articles
export const helpArticles: HelpArticle[] = [
  ...gettingStartedArticles,
  ...featuresArticles,
  ...troubleshootingArticles,
  ...apiCostsArticles,
  ...advancedArticles
]

// Category definitions
export const helpCategories: HelpCategory[] = [
  { id: 'getting-started', name: 'Getting Started', icon: '🚀' },
  { id: 'features', name: 'Features', icon: '✨' },
  { id: 'troubleshooting', name: 'Troubleshooting', icon: '🔧' },
  { id: 'api-costs', name: 'API Costs', icon: '💰' },
  { id: 'advanced', name: 'Advanced', icon: '🔬' }
]

// Helper functions
export function getArticlesByCategory(category: string): HelpArticle[] {
  return helpArticles.filter(article => article.category === category)
}

export function getArticleById(id: string): HelpArticle | undefined {
  return helpArticles.find(article => article.id === id)
}

export function getRelatedArticles(articleId: string): HelpArticle[] {
  const article = getArticleById(articleId)
  if (!article || !article.relatedArticles) return []
  
  return article.relatedArticles
    .map(id => getArticleById(id))
    .filter((a): a is HelpArticle => a !== undefined)
}

export function searchArticles(query: string): HelpArticle[] {
  const lowerQuery = query.toLowerCase()
  return helpArticles.filter(article =>
    article.title.toLowerCase().includes(lowerQuery) ||
    article.content.toLowerCase().includes(lowerQuery) ||
    article.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}

// Re-export types
export type { HelpArticle, HelpCategory } from './types'