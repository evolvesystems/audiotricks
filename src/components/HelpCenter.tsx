import React, { useState } from 'react'
import { 
  XMarkIcon, 
  MagnifyingGlassIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline'
import { 
  helpArticles, 
  helpCategories, 
  searchArticles, 
  getArticlesByCategory,
  getArticleById,
  getRelatedArticles,
  HelpArticle 
} from '../data/helpArticles'

interface HelpCenterProps {
  isOpen: boolean
  onClose: () => void
}

const HelpCenter: React.FC<HelpCenterProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null)
  const [searchResults, setSearchResults] = useState<HelpArticle[]>([])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      const results = searchArticles(query)
      setSearchResults(results)
      setSelectedCategory(null)
    } else {
      setSearchResults([])
    }
  }

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setSearchQuery('')
    setSearchResults([])
    setSelectedArticle(null)
  }

  const handleArticleSelect = (article: HelpArticle) => {
    setSelectedArticle(article)
  }

  const handleBack = () => {
    setSelectedArticle(null)
  }

  const convertMarkdownToHtml = (markdown: string): string => {
    let html = markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-3 text-gray-900">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-8 mb-4 text-gray-900 border-b border-gray-200 pb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-6 text-gray-900">$1</h1>')
      // Bold and Italic
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>')
      // Lists
      .replace(/^\d+\. (.+)$/gim, '<li class="ml-6 mb-2 list-decimal">$1</li>')
      .replace(/^\* (.+)$/gim, '<li class="ml-6 mb-2 list-disc">$1</li>')
      // Code
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>')
      // Tables
      .replace(/\|(.+)\|/g, (match) => {
        const cells = match.split('|').filter(cell => cell.trim())
        const isHeader = cells.every(cell => cell.includes('---'))
        if (isHeader) return ''
        
        const cellHtml = cells.map(cell => `<td class="border border-gray-300 px-3 py-2">${cell.trim()}</td>`).join('')
        return `<tr>${cellHtml}</tr>`
      })
      // Paragraphs
      .replace(/\n\n/g, '</p><p class="mb-4 text-gray-700 leading-relaxed">')
    
    // Wrap in paragraph tags
    html = '<p class="mb-4 text-gray-700 leading-relaxed">' + html + '</p>'
    
    // Wrap lists
    html = html.replace(/(<li class="ml-6 mb-2 list-disc">.*<\/li>)/s, '<ul class="mb-4">$1</ul>')
    html = html.replace(/(<li class="ml-6 mb-2 list-decimal">.*<\/li>)/s, '<ol class="mb-4">$1</ol>')
    
    // Wrap tables
    html = html.replace(/(<tr>.*<\/tr>)/s, '<table class="mb-4 w-full border-collapse">$1</table>')
    
    // Clean up
    html = html.replace(/<p class="mb-4 text-gray-700 leading-relaxed"><\/p>/g, '')
    
    return html
  }

  const displayArticles = searchQuery.trim() 
    ? searchResults 
    : selectedCategory 
      ? getArticlesByCategory(selectedCategory)
      : []

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full h-[90vh] flex">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <BookOpenIcon className="h-5 w-5 mr-2" />
                Help Center
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search help articles..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Categories or Search Results */}
          <div className="flex-1 overflow-y-auto">
            {!searchQuery.trim() && !selectedCategory && (
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Categories
                </h3>
                <div className="space-y-2">
                  {helpCategories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                      className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 flex items-center justify-between group"
                    >
                      <span className="flex items-center">
                        <span className="text-xl mr-3">{category.icon}</span>
                        <span className="font-medium text-gray-900">{category.name}</span>
                      </span>
                      <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(searchQuery.trim() || selectedCategory) && (
              <div className="p-4">
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800 mb-4"
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back to categories
                  </button>
                )}
                
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {searchQuery.trim() 
                    ? `Search Results (${searchResults.length})`
                    : helpCategories.find(c => c.id === selectedCategory)?.name
                  }
                </h3>
                
                {displayArticles.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No articles found
                  </p>
                ) : (
                  <div className="space-y-2">
                    {displayArticles.map(article => (
                      <button
                        key={article.id}
                        onClick={() => handleArticleSelect(article)}
                        className={`w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 ${
                          selectedArticle?.id === article.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <h4 className="font-medium text-gray-900 mb-1">
                          {article.title}
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {article.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Article Content */}
        <div className="flex-1 flex flex-col">
          {selectedArticle ? (
            <>
              {/* Article Header */}
              <div className="px-8 py-6 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedArticle.title}
                </h1>
                <div className="flex flex-wrap gap-2">
                  {selectedArticle.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Article Body */}
              <div className="flex-1 overflow-y-auto px-8 py-6">
                <div 
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: convertMarkdownToHtml(selectedArticle.content) 
                  }}
                />

                {/* Related Articles */}
                {selectedArticle.relatedArticles && selectedArticle.relatedArticles.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Related Articles
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getRelatedArticles(selectedArticle.id).map(related => (
                        <button
                          key={related.id}
                          onClick={() => handleArticleSelect(related)}
                          className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                        >
                          <h4 className="font-medium text-gray-900 mb-1">
                            {related.title}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {related.tags.slice(0, 2).join(', ')}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Welcome to Help Center
                </h3>
                <p className="text-gray-500 max-w-sm">
                  Browse categories or search for articles to get help with AudioTricks
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HelpCenter