import React from 'react'
import { 
  BriefcaseIcon, 
  AcademicCapIcon, 
  NewspaperIcon, 
  ChatBubbleLeftRightIcon,
  StarIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline'

const UseCasesSection: React.FC = () => {
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

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Product Manager',
      company: 'TechCorp',
      image: '/api/placeholder/48/48',
      content: 'AudioTricks has completely transformed how we handle our weekly team meetings. What used to take hours of manual note-taking now takes minutes to process.',
      rating: 5
    },
    {
      name: 'Dr. Michael Rodriguez',
      role: 'Professor',
      company: 'Stanford University',
      image: '/api/placeholder/48/48',
      content: 'The accuracy of transcriptions for my lectures is incredible. My students love having searchable transcripts, and it has improved engagement significantly.',
      rating: 5
    },
    {
      name: 'Emma Thompson',
      role: 'Content Creator',
      company: 'Digital Marketing Agency',
      image: '/api/placeholder/48/48',
      content: 'I use AudioTricks to convert my podcast interviews into blog posts. The AI summaries are so good that I barely need to edit them.',
      rating: 5
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

        {/* Testimonials Section */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-3xl p-12">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Loved by Thousands of Users
            </h3>
            <p className="text-lg text-gray-600">
              See what our customers are saying about their experience with AudioTricks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <UserCircleIcon className="h-12 w-12 text-gray-400 mr-4" />
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                    <p className="text-xs text-gray-500">{testimonial.company}</p>
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
        </div>

        {/* Stats */}
        <div className="mt-16 text-center">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-blue-600 mb-2">10k+</div>
              <div className="text-gray-600">Hours Transcribed</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-green-600 mb-2">99.5%</div>
              <div className="text-gray-600">Accuracy Rate</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-purple-600 mb-2">100+</div>
              <div className="text-gray-600">Languages</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-gray-600">Processing</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UseCasesSection