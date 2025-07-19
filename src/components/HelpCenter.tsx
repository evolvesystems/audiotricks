import React, { useState } from 'react'
import { 
  helpCategories, 
  searchArticles, 
  getArticlesByCategory,
  HelpArticle 
} from '../data/help'
import HelpSidebar from './HelpCenter/HelpSidebar'
import ArticleViewer from './HelpCenter/ArticleViewer'

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



  const displayArticles = searchQuery.trim() 
    ? searchResults 
    : selectedCategory 
      ? getArticlesByCategory(selectedCategory)
      : []

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full h-[90vh] flex">
        <HelpSidebar
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          searchResults={searchResults}
          displayArticles={displayArticles}
          helpCategories={helpCategories}
          selectedArticle={selectedArticle}
          onSearch={handleSearch}
          onCategorySelect={handleCategorySelect}
          onArticleSelect={handleArticleSelect}
          onClose={onClose}
        />

        <div className="flex-1 flex flex-col">
          <ArticleViewer
            selectedArticle={selectedArticle}
            onArticleSelect={handleArticleSelect}
          />
        </div>
      </div>
    </div>
  )
}

export default HelpCenter