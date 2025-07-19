import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ResultsDisplay2 from '../../components/ResultsDisplay2'
import { AudioProcessingResponse } from '../../types'

const mockResults: AudioProcessingResponse = {
  transcript: {
    text: 'Test transcript text',
    language: 'en',
    duration: 120
  },
  summary: {
    summary: 'Test summary',
    key_moments: [],
    total_duration: 120,
    word_count: 50,
    language: 'en'
  },
  processing_time: 10
}

describe('ResultsDisplay2', () => {
  // Test 1: Expected use - tab switching
  it('switches between tabs correctly', () => {
    render(
      <ResultsDisplay2
        results={mockResults}
        onExport={vi.fn()}
        elevenLabsKey="test-key"
      />
    )
    
    // Should start on overview tab
    expect(screen.getByText(/Test summary/)).toBeInTheDocument()
    
    // Click on transcript tab
    const transcriptTab = screen.getByText('Transcript')
    fireEvent.click(transcriptTab)
    
    // Should show transcript content
    expect(screen.getByText(/Test transcript text/)).toBeInTheDocument()
  })

  // Test 2: Edge case - handles missing data
  it('handles missing optional data gracefully', () => {
    const minimalResults: AudioProcessingResponse = {
      transcript: {
        text: 'Minimal transcript'
      },
      summary: {
        summary: 'Minimal summary',
        key_moments: [],
        word_count: 10
      },
      processing_time: 5
    }
    
    render(
      <ResultsDisplay2
        results={minimalResults}
        onExport={vi.fn()}
        elevenLabsKey=""
      />
    )
    
    // Should render without errors
    expect(screen.getByText(/Minimal summary/)).toBeInTheDocument()
  })

  // Test 3: Failure case - renders error state
  it('renders all tabs without crashing', () => {
    const { container } = render(
      <ResultsDisplay2
        results={mockResults}
        onExport={vi.fn()}
        elevenLabsKey="test-key"
      />
    )
    
    const tabs = ['Overview', 'Transcript', 'Podcasts', 'Editor']
    
    tabs.forEach(tabName => {
      const tab = screen.getByText(tabName)
      fireEvent.click(tab)
      
      // Should not have any error boundaries triggered
      expect(container.querySelector('.error-boundary')).not.toBeInTheDocument()
    })
  })
})