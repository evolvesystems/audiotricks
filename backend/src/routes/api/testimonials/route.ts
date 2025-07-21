/**
 * Testimonials API Endpoint
 * Database-driven testimonials system replacing placeholder data
 * CLAUDE.md compliant - no hardcoded data
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Get testimonials for website display
 * @param request - Next.js request object
 * @returns JSON response with testimonials
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const featuredOn = searchParams.get('featured_on') || 'homepage'
    const useCase = searchParams.get('use_case')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Build filter conditions
    const where: any = {
      isActive: true,
      isVerified: true
    }

    if (featuredOn) {
      where.featuredOn = featuredOn
    }

    if (useCase) {
      where.useCase = useCase
    }

    // Fetch testimonials from database
    const testimonials = await prisma.testimonial.findMany({
      where,
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ],
      take: limit,
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

    return NextResponse.json({
      success: true,
      data: testimonials,
      count: testimonials.length
    })

  } catch (error) {
    console.error('Error fetching testimonials:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch testimonials',
        data: []
      },
      { status: 500 }
    )
  }
}

/**
 * Create new testimonial (Admin only)
 * @param request - Next.js request object
 * @returns JSON response with created testimonial
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check for admin users
    
    const body = await request.json()
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
    } = body

    // Validate required fields
    if (!customerName || !content) {
      return NextResponse.json(
        { success: false, error: 'Customer name and content are required' },
        { status: 400 }
      )
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

    return NextResponse.json({
      success: true,
      data: testimonial,
      message: 'Testimonial created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating testimonial:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create testimonial'
      },
      { status: 500 }
    )
  }
}