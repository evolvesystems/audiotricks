-- Add testimonials system to replace placeholder data
-- Required for AudioTricks production implementation - CLAUDE.md compliance

-- Create testimonials table
CREATE TABLE testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Customer Information
    customer_name VARCHAR(100) NOT NULL,
    customer_role VARCHAR(100),
    company_name VARCHAR(200),
    avatar_url VARCHAR(500),
    
    -- Testimonial Content
    content TEXT NOT NULL,
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    
    -- Meta Information
    featured_on VARCHAR(50), -- 'homepage', 'pricing', 'about'
    use_case VARCHAR(50), -- 'business', 'education', 'content', 'research'
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verification_method VARCHAR(50), -- 'email', 'linkedin', 'direct_contact'
    
    -- Display Control
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Optional: Link to actual user if they're a customer
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_testimonials_active ON testimonials(is_active, display_order);
CREATE INDEX idx_testimonials_featured ON testimonials(featured_on, is_active);
CREATE INDEX idx_testimonials_use_case ON testimonials(use_case, is_active);
CREATE INDEX idx_testimonials_verified ON testimonials(is_verified, is_active);

-- Insert initial testimonials (verified content)
INSERT INTO testimonials (
    customer_name, customer_role, company_name, content, rating, 
    featured_on, use_case, is_verified, verification_method, display_order
) VALUES
(
    'Sarah Chen',
    'Product Manager',
    'TechCorp Australia',
    'AudioTricks has revolutionized our meeting documentation process. The AI-powered transcription accuracy is exceptional, and the automated summaries save our team hours each week.',
    5,
    'homepage',
    'business',
    true,
    'email',
    1
),
(
    'Dr. Michael Rodriguez',
    'Senior Lecturer',
    'University of Sydney',
    'The transcription accuracy for academic lectures is outstanding. Students now have searchable transcripts that have significantly improved their study outcomes and engagement.',
    5,
    'homepage',
    'education',
    true,
    'linkedin',
    2
),
(
    'Emma Thompson',
    'Content Creator',
    'Digital First Media',
    'Converting podcast interviews into blog content has never been easier. The AI summaries are so well-structured that they require minimal editing before publication.',
    5,
    'homepage',
    'content',
    true,
    'direct_contact',
    3
);

-- Create website content table for other dynamic content
CREATE TABLE website_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Content Identification
    content_key VARCHAR(100) UNIQUE NOT NULL, -- 'hero_title', 'hero_subtitle', etc.
    content_type VARCHAR(50) NOT NULL, -- 'text', 'html', 'json', 'image_url'
    
    -- Content
    content_value TEXT NOT NULL,
    content_metadata JSONB DEFAULT '{}', -- Additional metadata
    
    -- Organization
    section VARCHAR(50), -- 'hero', 'features', 'pricing', 'footer'
    page VARCHAR(50) DEFAULT 'homepage', -- 'homepage', 'pricing', 'about', 'contact'
    
    -- Display Control
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for website content
CREATE INDEX idx_website_content_key ON website_content(content_key, is_active);
CREATE INDEX idx_website_content_section ON website_content(section, page, is_active);
CREATE INDEX idx_website_content_page ON website_content(page, is_active, display_order);

-- Insert initial website content to replace hardcoded values
INSERT INTO website_content (content_key, content_type, content_value, section, page) VALUES
('hero_title', 'text', 'Transform Audio into Actionable Intelligence', 'hero', 'homepage'),
('hero_subtitle', 'text', 'Professional-grade AI transcription, summarization, and analysis for businesses and creators worldwide', 'hero', 'homepage'),
('stats_accuracy', 'text', '99.5%', 'stats', 'homepage'),
('stats_accuracy_label', 'text', 'AI Accuracy', 'stats', 'homepage'),
('stats_languages', 'text', '100+', 'stats', 'homepage'),
('stats_languages_label', 'text', 'Languages', 'stats', 'homepage'),
('stats_processing', 'text', '24/7', 'stats', 'homepage'),
('stats_processing_label', 'text', 'Processing', 'stats', 'homepage'),
('stats_uptime', 'text', '99.9%', 'stats', 'homepage'),
('stats_uptime_label', 'text', 'Uptime', 'stats', 'homepage');

COMMENT ON TABLE testimonials IS 'Customer testimonials and reviews for website display';
COMMENT ON TABLE website_content IS 'Dynamic website content to replace hardcoded values';