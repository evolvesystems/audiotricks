import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHistory } from '../../hooks/useHistory'
import { AudioProcessingResponse } from '../../types'

describe('useHistory', () => {
  const mockHistoryItem: AudioProcessingResponse = {
    transcript: {
      text: 'Test transcript',
      segments: [],
      duration: 60
    },
    summary: {
      summary: 'Test summary',
      key_moments: [],
      total_duration: 60,
      language: 'en'
    },
    processing_time: 5
  }

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  // Test 1: Expected use - adding item to history
  it('adds items to history correctly', () => {
    const { result } = renderHook(() => useHistory())
    
    expect(result.current.history).toHaveLength(0)
    
    act(() => {
      result.current.addToHistory(mockHistoryItem)
    })
    
    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0].results.transcript.text).toBe('Test transcript')
  })

  // Test 2: Edge case - history limit
  it('limits history to maximum items', () => {
    const { result } = renderHook(() => useHistory())
    
    // Add more than limit (assuming limit is 50)
    for (let i = 0; i < 55; i++) {
      act(() => {
        result.current.addToHistory({
          ...mockHistoryItem,
          transcript: { ...mockHistoryItem.transcript, text: `Item ${i}` }
        })
      })
    }
    
    // Should be limited to 50
    expect(result.current.history.length).toBeLessThanOrEqual(50)
  })

  // Test 3: Failure case - corrupt localStorage data
  it('handles corrupt localStorage data gracefully', () => {
    // Set corrupt data
    localStorage.setItem('audioTricks_history', 'invalid json{')
    
    const { result } = renderHook(() => useHistory())
    
    // Should fallback to empty array
    expect(result.current.history).toHaveLength(0)
  })

  // Test 4: Remove item from history
  it('removes items from history by id', () => {
    const { result } = renderHook(() => useHistory())
    
    act(() => {
      result.current.addToHistory(mockHistoryItem)
    })
    
    const itemId = result.current.history[0].id
    
    act(() => {
      result.current.removeFromHistory(itemId)
    })
    
    expect(result.current.history).toHaveLength(0)
  })

  // Test 5: Clear all history
  it('clears all history items', () => {
    const { result } = renderHook(() => useHistory())
    
    // Add multiple items
    act(() => {
      result.current.addToHistory(mockHistoryItem)
      result.current.addToHistory(mockHistoryItem)
      result.current.addToHistory(mockHistoryItem)
    })
    
    expect(result.current.history).toHaveLength(3)
    
    act(() => {
      result.current.clearHistory()
    })
    
    expect(result.current.history).toHaveLength(0)
  })
})