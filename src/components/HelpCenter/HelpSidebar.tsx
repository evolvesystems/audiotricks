import React from 'react'
import { 
  MagnifyingGlassIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  BookOpenIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { HelpArticle, HelpCategory } from '../../data/help/types'

interface HelpSidebarProps {
  searchQuery: string
  selectedCategory: string | null
  searchResults: HelpArticle[]
  displayArticles: HelpArticle[]
  helpCategories: HelpCategory[]
  selectedArticle: HelpArticle | null
  onSearch: (query: string) => void
  onCategorySelect: (categoryId: string) => void
  onArticleSelect: (article: HelpArticle) => void
  onClose: () => void
}

const HelpSidebar: React.FC<HelpSidebarProps> = ({
  searchQuery,
  selectedCategory,
  searchResults,
  displayArticles,
  helpCategories,
  selectedArticle,
  onSearch,
  onCategorySelect,
  onArticleSelect,
  onClose
}) => {
  return (
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
            onChange={(e) => onSearch(e.target.value)}
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
                  onClick={() => onCategorySelect(category.id)}
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
                onClick={() => onCategorySelect('')}
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
                    onClick={() => onArticleSelect(article)}
                    className={`w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 ${
                      selectedArticle?.id === article.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <h4 className="font-medium text-gray-900 mb-1 flex items-center">
                      {article.title}
                      {article.id === 'changelog' && (
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          NEW
                        </span>
                      )}
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
  )
}

export default HelpSidebar