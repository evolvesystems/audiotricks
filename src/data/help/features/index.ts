import { HelpArticle } from '../types'
import { uploadingArticles } from './uploading'
import { processingArticles } from './processing'
import { resultsArticles } from './results'
import { historyArticles } from './history'
import { editorArticles } from './editor'
import { synthesisArticles } from './synthesis'
import { audioEditorArticles } from './audioEditor'

export const featuresArticles: HelpArticle[] = [
  ...uploadingArticles,
  ...processingArticles,
  ...resultsArticles,
  ...historyArticles,
  ...editorArticles,
  ...synthesisArticles,
  ...audioEditorArticles
]