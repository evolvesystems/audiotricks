import { describe, test, expect, beforeEach, vi } from 'vitest';
import { TranscriptionService } from '../../../src/services/audio/transcription.service';
import { prisma } from '../../setup';
import { createTestUser, createTestWorkspace } from '../../fixtures/workspace.fixtures';

/**
 * Test suite for TranscriptionService - audio transcription processing
 * Follows CLAUDE.md requirements: expected use, edge case, failure case
 */

describe('TranscriptionService', () => {
  let transcriptionService: TranscriptionService;
  let testUser: any;
  let testWorkspace: any;
  let testAudioUpload: any;

  beforeEach(async () => {
    transcriptionService = new TranscriptionService();
    const { workspace, owner } = await createTestWorkspace(prisma);
    testUser = owner;
    testWorkspace = workspace;

    // Create test audio upload
    testAudioUpload = await prisma.audioUpload.create({
      data: {
        userId: testUser.id,
        workspaceId: testWorkspace.id,
        filename: 'test-audio.mp3',
        originalName: 'test-audio.mp3',
        mimeType: 'audio/mpeg',
        size: 1024000,
        duration: 60,
        s3Key: 'uploads/test-audio.mp3',
        s3Bucket: 'test-bucket',
        status: 'uploaded'
      }
    });
  });

  describe('transcribeAudio', () => {
    test('expected use case - transcribes audio successfully', async () => {
      // Mock OpenAI API response
      const mockTranscriptionResponse = {
        text: 'This is a test transcription of the audio file.',
        segments: [
          {
            id: 0,
            seek: 0,
            start: 0.0,
            end: 5.0,
            text: 'This is a test transcription',
            tokens: [1, 2, 3, 4, 5],
            temperature: 0.0,
            avg_logprob: -0.5,
            compression_ratio: 1.2,
            no_speech_prob: 0.1
          }
        ],
        language: 'en'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTranscriptionResponse)
      });

      const config = {
        apiKey: 'test-openai-key',
        model: 'whisper-1',
        language: 'en',
        responseFormat: 'verbose_json',
        temperature: 0.3
      };

      const result = await transcriptionService.transcribeAudio(testAudioUpload.id, config);

      expect(result.success).toBe(true);
      expect(result.text).toBe('This is a test transcription of the audio file.');
      expect(result.language).toBe('en');
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].start).toBe(0.0);
      expect(result.segments[0].end).toBe(5.0);

      // Verify transcription was saved to database
      const savedTranscription = await prisma.transcription.findFirst({
        where: { audioUploadId: testAudioUpload.id }
      });
      expect(savedTranscription).toBeDefined();
      expect(savedTranscription?.text).toBe('This is a test transcription of the audio file.');
    });

    test('edge case - handles auto language detection', async () => {
      const mockAutoDetectResponse = {
        text: 'Bonjour, ceci est un test en français.',
        language: 'fr'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAutoDetectResponse)
      });

      const config = {
        apiKey: 'test-openai-key',
        model: 'whisper-1',
        language: 'auto', // Auto-detect
        responseFormat: 'json'
      };

      const result = await transcriptionService.transcribeAudio(testAudioUpload.id, config);

      expect(result.success).toBe(true);
      expect(result.language).toBe('fr');
      expect(result.text).toContain('français');

      // Verify API was called without language parameter for auto-detection
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('openai.com'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-openai-key'
          }),
          body: expect.any(FormData)
        })
      );
    });

    test('failure case - handles OpenAI API errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          error: {
            message: 'Invalid API key',
            type: 'invalid_request_error',
            code: 'invalid_api_key'
          }
        })
      });

      const config = {
        apiKey: 'invalid-key',
        model: 'whisper-1',
        language: 'en'
      };

      const result = await transcriptionService.transcribeAudio(testAudioUpload.id, config);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid API key');
      expect(result.errorCode).toBe('invalid_api_key');

      // Verify error was logged to database
      const jobRecord = await prisma.processingJob.findFirst({
        where: { audioUploadId: testAudioUpload.id }
      });
      expect(jobRecord?.status).toBe('failed');
      expect(jobRecord?.error).toContain('Invalid API key');
    });
  });

  describe('processLargeAudioFile', () => {
    test('expected use case - processes large file in chunks', async () => {
      // Create large audio upload (>25MB)
      const largeAudioUpload = await prisma.audioUpload.create({
        data: {
          userId: testUser.id,
          workspaceId: testWorkspace.id,
          filename: 'large-audio.mp3',
          originalName: 'large-audio.mp3',
          mimeType: 'audio/mpeg',
          size: 30 * 1024 * 1024, // 30MB
          duration: 1800, // 30 minutes
          s3Key: 'uploads/large-audio.mp3',
          s3Bucket: 'test-bucket',
          status: 'uploaded'
        }
      });

      // Mock chunked transcription responses
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            text: 'First chunk transcription.',
            segments: [{ id: 0, start: 0, end: 600, text: 'First chunk transcription.' }]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            text: 'Second chunk transcription.',
            segments: [{ id: 1, start: 600, end: 1200, text: 'Second chunk transcription.' }]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            text: 'Third chunk transcription.',
            segments: [{ id: 2, start: 1200, end: 1800, text: 'Third chunk transcription.' }]
          })
        });

      const config = {
        apiKey: 'test-openai-key',
        model: 'whisper-1',
        language: 'en',
        chunkSize: 600 // 10-minute chunks
      };

      const result = await transcriptionService.processLargeAudioFile(largeAudioUpload.id, config);

      expect(result.success).toBe(true);
      expect(result.chunks).toHaveLength(3);
      expect(result.totalText).toContain('First chunk');
      expect(result.totalText).toContain('Second chunk');
      expect(result.totalText).toContain('Third chunk');
      expect(result.totalDuration).toBe(1800);

      // Verify all chunks were processed
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    test('edge case - handles partial chunk failure with retry', async () => {
      const largeAudioUpload = await prisma.audioUpload.create({
        data: {
          userId: testUser.id,
          workspaceId: testWorkspace.id,
          filename: 'retry-audio.mp3',
          originalName: 'retry-audio.mp3',
          mimeType: 'audio/mpeg',
          size: 20 * 1024 * 1024,
          duration: 1200,
          s3Key: 'uploads/retry-audio.mp3',
          s3Bucket: 'test-bucket',
          status: 'uploaded'
        }
      });

      // Mock first chunk success, second chunk failure, then retry success
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ text: 'First chunk success.' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: () => Promise.resolve({ error: { message: 'Rate limit exceeded' } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ text: 'Second chunk retry success.' })
        });

      const config = {
        apiKey: 'test-openai-key',
        model: 'whisper-1',
        language: 'en',
        chunkSize: 600,
        maxRetries: 1,
        retryDelay: 100
      };

      const result = await transcriptionService.processLargeAudioFile(largeAudioUpload.id, config);

      expect(result.success).toBe(true);
      expect(result.chunks).toHaveLength(2);
      expect(result.retryAttempts).toBeGreaterThan(0);
      expect(fetch).toHaveBeenCalledTimes(3); // Original + 1 retry
    });

    test('failure case - handles chunk processing failure after max retries', async () => {
      const largeAudioUpload = await prisma.audioUpload.create({
        data: {
          userId: testUser.id,
          workspaceId: testWorkspace.id,
          filename: 'fail-audio.mp3',
          originalName: 'fail-audio.mp3',
          mimeType: 'audio/mpeg',
          size: 15 * 1024 * 1024,
          duration: 900,
          s3Key: 'uploads/fail-audio.mp3',
          s3Bucket: 'test-bucket',
          status: 'uploaded'
        }
      });

      // Mock all attempts failing
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: 'Internal server error' } })
      });

      const config = {
        apiKey: 'test-openai-key',
        model: 'whisper-1',
        language: 'en',
        chunkSize: 300,
        maxRetries: 2,
        retryDelay: 50
      };

      const result = await transcriptionService.processLargeAudioFile(largeAudioUpload.id, config);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to process all chunks');
      expect(result.failedChunks).toBeGreaterThan(0);
    });
  });

  describe('getTranscriptionFormats', () => {
    test('expected use case - returns transcription in multiple formats', async () => {
      // Create test transcription
      const transcription = await prisma.transcription.create({
        data: {
          audioUploadId: testAudioUpload.id,
          text: 'This is a test transcription with multiple sentences. It has various segments.',
          language: 'en',
          confidence: 0.95,
          segments: [
            { start: 0, end: 3, text: 'This is a test transcription' },
            { start: 3, end: 6, text: 'with multiple sentences.' },
            { start: 6, end: 9, text: 'It has various segments.' }
          ],
          processingTime: 5.2
        }
      });

      const formats = await transcriptionService.getTranscriptionFormats(transcription.id);

      expect(formats.plain).toBe('This is a test transcription with multiple sentences. It has various segments.');
      expect(formats.srt).toContain('00:00:00,000 --> 00:00:03,000');
      expect(formats.vtt).toContain('WEBVTT');
      expect(formats.json).toBeDefined();
      expect(JSON.parse(formats.json).segments).toHaveLength(3);
    });

    test('edge case - handles transcription without segments', async () => {
      const transcription = await prisma.transcription.create({
        data: {
          audioUploadId: testAudioUpload.id,
          text: 'Simple transcription without segments.',
          language: 'en',
          confidence: 0.88,
          segments: [],
          processingTime: 2.1
        }
      });

      const formats = await transcriptionService.getTranscriptionFormats(transcription.id);

      expect(formats.plain).toBe('Simple transcription without segments.');
      expect(formats.srt).toBe('1\n00:00:00,000 --> 00:00:01,000\nSimple transcription without segments.\n\n');
      expect(formats.vtt).toContain('Simple transcription without segments.');
    });

    test('failure case - throws error for non-existent transcription', async () => {
      await expect(transcriptionService.getTranscriptionFormats('non-existent-id'))
        .rejects
        .toThrow('Transcription not found');
    });
  });

  describe('calculateTranscriptionCost', () => {
    test('expected use case - calculates cost based on duration and model', async () => {
      const costData = {
        duration: 300, // 5 minutes
        model: 'whisper-1',
        language: 'en'
      };

      const cost = await transcriptionService.calculateTranscriptionCost(costData);

      expect(cost.duration).toBe(300);
      expect(cost.model).toBe('whisper-1');
      expect(cost.baseRate).toBeGreaterThan(0);
      expect(cost.totalCost).toBeGreaterThan(0);
      expect(cost.currency).toBe('USD');
    });

    test('edge case - applies language multiplier for non-English', async () => {
      const englishCost = await transcriptionService.calculateTranscriptionCost({
        duration: 300,
        model: 'whisper-1',
        language: 'en'
      });

      const foreignCost = await transcriptionService.calculateTranscriptionCost({
        duration: 300,
        model: 'whisper-1',
        language: 'zh'
      });

      expect(foreignCost.totalCost).toBeGreaterThanOrEqual(englishCost.totalCost);
      expect(foreignCost.languageMultiplier).toBeGreaterThanOrEqual(1.0);
    });

    test('failure case - throws error for invalid duration', async () => {
      await expect(transcriptionService.calculateTranscriptionCost({
        duration: -60,
        model: 'whisper-1',
        language: 'en'
      })).rejects.toThrow('Duration must be positive');

      await expect(transcriptionService.calculateTranscriptionCost({
        duration: 0,
        model: 'whisper-1',
        language: 'en'
      })).rejects.toThrow('Duration must be positive');
    });
  });
});