import React from 'react'
import { BookOpenIcon } from '@heroicons/react/24/outline'
import { HelpArticle } from '../../data/help/types'
import { sanitizeMarkdownHtml } from '../../utils/sanitize'
import { convertMarkdownToHtml } from '../../utils/markdownConverter'
import { getRelatedArticles } from '../../data/help'

interface ArticleViewerProps {
  selectedArticle: HelpArticle | null
  onArticleSelect: (article: HelpArticle) => void
}

const ArticleViewer: React.FC<ArticleViewerProps> = ({ selectedArticle, onArticleSelect }) => {
  if (!selectedArticle) {
    return (
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
    )
  }

  return (
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
            __html: sanitizeMarkdownHtml(convertMarkdownToHtml(selectedArticle.content)) 
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
                  onClick={() => onArticleSelect(related)}
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
  )
}

export default ArticleViewer