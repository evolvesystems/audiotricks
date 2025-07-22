/**
 * Custom hook for fetching testimonials
 * Database-driven testimonials system - CLAUDE.md compliant
 */

import { useState, useEffect } from 'react'
import { logger } from '../utils/logger'

export interface Testimonial {
  id: string
  customerName: string
  customerRole?: string
  companyName?: string
  avatarUrl?: string
  content: string
  rating: number
  useCase?: string
}

interface UseTestimonialsOptions {
  featuredOn?: string
  useCase?: string
  limit?: number
}

interface UseTestimonialsReturn {
  testimonials: Testimonial[]
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Hook to fetch testimonials from the database
 * @param options - Filter options for testimonials
 * @returns Testimonials data, loading state, and error
 */
export function useTestimonials(options: UseTestimonialsOptions = {}): UseTestimonialsReturn {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { featuredOn = 'homepage', useCase, limit = 10 } = options

  const fetchTestimonials = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        featured_on: featuredOn,
        limit: limit.toString()
      })

      if (useCase) {
        params.append('use_case', useCase)
      }

      const response = await fetch(`/api/testimonials?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch testimonials: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        setTestimonials(result.data || [])
      } else {
        throw new Error(result.error || 'Failed to load testimonials')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      logger.error('Error fetching testimonials:', err)
      
      // Fallback: Don't show any testimonials instead of placeholder data
      setTestimonials([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTestimonials()
  }, [featuredOn, useCase, limit])

  return {
    testimonials,
    loading,
    error,
    refetch: fetchTestimonials
  }
}

/**
 * Hook to fetch testimonials by use case
 * @param useCase - Specific use case to filter by
 * @returns Testimonials data for the use case
 */
export function useTestimonialsByUseCase(useCase: string): UseTestimonialsReturn {
  return useTestimonials({ useCase, limit: 3 })
}

/**
 * Hook to fetch featured testimonials for homepage
 * @returns Homepage featured testimonials
 */
export function useFeaturedTestimonials(): UseTestimonialsReturn {
  return useTestimonials({ featuredOn: 'homepage', limit: 3 })
}