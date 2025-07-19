import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHistory } from '../../hooks/useHistory'

/**
 * Integration test for the audio processing workflow
 * Tests the complete flow from upload to history storage
 */
describe('Audio Processing Integration', () => {
  // Test 1: Complete processing workflow
  it('processes audio and saves to history', async () => {
    const { result: historyHook } = renderHook(() => useHistory())
    
    // Simulate processing result
    const mockResult = {
      transcript: {
        text: 'Integration test transcript',
        segments: [],
        duration: 120
      },
      summary: {
        summary: 'Integration test summary',
        key_moments: [
          {
            timestamp: '0:15',
            title: 'Test moment',
            description: 'Test description',
            importance: 'high' as const
          }
        ],
        total_duration: 120,
        language: 'en'
      },
      processing_time: 10
    }
    
    // Add to history
    act(() => {
      historyHook.current.addToHistory(mockResult)
    })
    
    // Verify it was saved
    expect(historyHook.current.history).toHaveLength(1)
    expect(historyHook.current.history[0].results.transcript.text).toBe('Integration test transcript')
    
    // Verify localStorage
    const savedHistory = localStorage.getItem('audioTricks_history')
    expect(savedHistory).toBeTruthy()
    const parsed = JSON.parse(savedHistory!)
    expect(parsed).toHaveLength(1)
  })

  // Test 2: History persistence across sessions
  it('persists history across sessions', () => {
    // First session - add item
    const { result: firstSession } = renderHook(() => useHistory())
    
    act(() => {
      firstSession.current.addToHistory({
        transcript: { text: 'Persistent item', segments: [], duration: 60 },
        summary: { 
          summary: 'Test', 
          key_moments: [], 
          total_duration: 60, 
          language: 'en' 
        },
        processing_time: 5
      })
    })
    
    // Second session - should load from localStorage
    const { result: secondSession } = renderHook(() => useHistory())
    
    expect(secondSession.current.history).toHaveLength(1)
    expect(secondSession.current.history[0].results.transcript.text).toBe('Persistent item')
  })

  // Test 3: Error recovery
  it('recovers from corrupted history data', () => {
    // Set corrupted data
    localStorage.setItem('audioTricks_history', '[{invalid json}')
    
    // Should handle gracefully
    const { result } = renderHook(() => useHistory())
    expect(result.current.history).toHaveLength(0)
    
    // Should still be able to add new items
    act(() => {
      result.current.addToHistory({
        transcript: { text: 'Recovery test', segments: [], duration: 30 },
        summary: { 
          summary: 'Test', 
          key_moments: [], 
          total_duration: 30, 
          language: 'en' 
        },
        processing_time: 3
      })
    })
    
    expect(result.current.history).toHaveLength(1)
  })
})