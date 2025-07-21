import React from 'react'
import { 
  BriefcaseIcon, 
  AcademicCapIcon, 
  NewspaperIcon, 
  ChatBubbleLeftRightIcon,
  StarIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline'
import { useFeaturedTestimonials } from '../hooks/useTestimonials'

const UseCasesSection: React.FC = () => {
  // Fetch testimonials from database instead of using hardcoded placeholder data
  const { testimonials, loading: testimonialsLoading } = useFeaturedTestimonials()

  const useCases = [
    {
      icon: BriefcaseIcon,
      title: 'Business Meetings',
      description: 'Transform long meetings into actionable summaries with key decisions and follow-ups',
      features: ['Meeting minutes', 'Action items', 'Decision tracking', 'Team alignment'],
      color: 'blue'
    },
    {
      icon: AcademicCapIcon,
      title: 'Education & Training',
      description: 'Convert lectures, courses, and training sessions into searchable transcripts',
      features: ['Lecture notes', 'Study materials', 'Course summaries', 'Learning aids'],
      color: 'green'
    },
    {
      icon: NewspaperIcon,
      title: 'Content Creation',
      description: 'Turn podcasts, interviews, and videos into blog posts and articles',
      features: ['Content repurposing', 'Quote extraction', 'Blog generation', 'SEO optimization'],
      color: 'purple'
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Customer Research',
      description: 'Analyze customer interviews and feedback to uncover valuable insights',
      features: ['Interview analysis', 'Sentiment tracking', 'Theme identification', 'Insights extraction'],
      color: 'orange'
    }
  ]

  return (
    <div className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Use Cases Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Perfect for Every Use Case
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Whether you're in business, education, content creation, or research, 
            AudioTricks adapts to your specific needs and workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon
            return (
              <div key={index} className="group bg-gray-50 rounded-2xl p-8 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-200">
                <div className="flex items-start space-x-4">
                  <div className="p-4 rounded-xl bg-blue-100 group-hover:bg-blue-600 transition-colors duration-300">
                    <Icon className="h-8 w-8 text-blue-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{useCase.title}</h3>
                    <p className="text-gray-600 mb-4">{useCase.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {useCase.features.map((feature, idx) => (
                        <span key={idx} className="px-3 py-1 bg-white text-gray-700 text-sm rounded-full border border-gray-200">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Testimonials Section - Database Driven */}
        {testimonials.length > 0 && (
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-3xl p-12">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Trusted by Professionals Worldwide
              </h3>
              <p className="text-lg text-gray-600">
                See what our customers are saying about their experience with AudioTricks
              </p>
            </div>

            {testimonialsLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center mb-4">
                      {testimonial.avatarUrl ? (
                        <img 
                          src={testimonial.avatarUrl} 
                          alt={testimonial.customerName}
                          className="h-12 w-12 rounded-full mr-4 object-cover"
                        />
                      ) : (
                        <UserCircleIcon className="h-12 w-12 text-gray-400 mr-4" />
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-900">{testimonial.customerName}</h4>
                        {testimonial.customerRole && (
                          <p className="text-sm text-gray-600">{testimonial.customerRole}</p>
                        )}
                        {testimonial.companyName && (
                          <p className="text-xs text-gray-500">{testimonial.companyName}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <StarIcon key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    
                    <p className="text-gray-700 text-sm leading-relaxed">
                      "{testimonial.content}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Platform Statistics */}
        <div className="mt-16 text-center">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-blue-600 mb-2">Enterprise</div>
              <div className="text-gray-600">Ready</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-green-600 mb-2">99.5%</div>
              <div className="text-gray-600">AI Accuracy</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-purple-600 mb-2">100+</div>
              <div className="text-gray-600">Languages</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-orange-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UseCasesSection