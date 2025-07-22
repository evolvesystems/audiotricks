/**
 * Testimonials API Routes
 * Database-driven testimonials system replacing placeholder data
 * CLAUDE.md compliant - no hardcoded data
 */

import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

/**
 * Get testimonials for website display
 * GET /api/testimonials
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { featured_on = 'homepage', use_case, limit = '10' } = req.query

    // Build filter conditions
    const where: any = {
      isActive: true,
      isVerified: true
    }

    if (featured_on) {
      where.featuredOn = featured_on as string
    }

    if (use_case) {
      where.useCase = use_case as string
    }

    // Fetch testimonials from database
    const testimonials = await prisma.testimonial.findMany({
      where,
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ],
      take: parseInt(limit as string),
      select: {
        id: true,
        customerName: true,
        customerRole: true,
        companyName: true,
        avatarUrl: true,
        content: true,
        rating: true,
        useCase: true
      }
    })

    res.json({
      success: true,
      data: testimonials,
      count: testimonials.length
    })

  } catch (error) {
    console.error('Error fetching testimonials:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch testimonials',
      data: []
    })
  }
})

/**
 * Create new testimonial (Admin only)
 * POST /api/testimonials
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // TODO: Add authentication check for admin users
    
    const {
      customerName,
      customerRole,
      companyName,
      avatarUrl,
      content,
      rating = 5,
      featuredOn = 'homepage',
      useCase,
      isVerified = false,
      verificationMethod,
      displayOrder = 0
    } = req.body

    // Validate required fields
    if (!customerName || !content) {
      return res.status(400).json({
        success: false,
        error: 'Customer name and content are required'
      })
    }

    // Create testimonial
    const testimonial = await prisma.testimonial.create({
      data: {
        customerName,
        customerRole,
        companyName,
        avatarUrl,
        content,
        rating: Math.min(Math.max(rating, 1), 5), // Clamp between 1-5
        featuredOn,
        useCase,
        isVerified,
        verificationMethod,
        displayOrder
      }
    })

    res.status(201).json({
      success: true,
      data: testimonial,
      message: 'Testimonial created successfully'
    })

  } catch (error) {
    console.error('Error creating testimonial:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create testimonial'
    })
  }
})

/**
 * Update testimonial (Admin only)
 * PUT /api/testimonials/:id
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: updateData
    })

    res.json({
      success: true,
      data: testimonial,
      message: 'Testimonial updated successfully'
    })

  } catch (error) {
    console.error('Error updating testimonial:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update testimonial'
    })
  }
})

/**
 * Delete testimonial (Admin only)
 * DELETE /api/testimonials/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await prisma.testimonial.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Testimonial deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting testimonial:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete testimonial'
    })
  }
})

export default router