import { HelpArticle } from '../types'
import { apiIssuesArticle } from './apiIssues'
import { recoveryArticle } from './recovery'

export const troubleshootingArticles: HelpArticle[] = [
  apiIssuesArticle,
  recoveryArticle
]