import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UploadDropzone } from '../../../components/AudioUploader/UploadDropzone';

/**
 * Test suite for UploadDropzone component - core audio upload functionality
 * Follows CLAUDE.md requirements: expected use, edge case, failure case
 */

describe('UploadDropzone Component', () => {
  const mockOnFileDrop = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('expected use case - renders dropzone with correct content', () => {
    render(<UploadDropzone onFileDrop={mockOnFileDrop} />);
    
    expect(screen.getByText(/drag & drop your audio file here/i)).toBeInTheDocument();
    expect(screen.getByText(/or click to browse/i)).toBeInTheDocument();
    expect(screen.getByText(/supports mp3, wav, m4a, flac/i)).toBeInTheDocument();
    expect(screen.getByText(/max file size: 25mb/i)).toBeInTheDocument();
  });

  test('expected use case - handles file drop correctly', () => {
    render(<UploadDropzone onFileDrop={mockOnFileDrop} />);
    
    const dropzone = screen.getByTestId('upload-dropzone');
    const file = new File(['audio content'], 'test-audio.mp3', { type: 'audio/mpeg' });
    
    fireEvent.dragOver(dropzone);
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });
    
    expect(mockOnFileDrop).toHaveBeenCalledWith([file]);
  });

  test('expected use case - handles file input selection', () => {
    render(<UploadDropzone onFileDrop={mockOnFileDrop} />);
    
    const fileInput = screen.getByTestId('file-input');
    const file = new File(['audio content'], 'test-audio.mp3', { type: 'audio/mpeg' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    expect(mockOnFileDrop).toHaveBeenCalledWith([file]);
  });

  test('edge case - shows drag active state', () => {
    render(<UploadDropzone onFileDrop={mockOnFileDrop} />);
    
    const dropzone = screen.getByTestId('upload-dropzone');
    
    fireEvent.dragEnter(dropzone);
    expect(dropzone).toHaveClass('border-blue-500', 'bg-blue-50');
    
    fireEvent.dragLeave(dropzone);
    expect(dropzone).not.toHaveClass('border-blue-500', 'bg-blue-50');
  });

  test('edge case - disabled state prevents interaction', () => {
    render(<UploadDropzone onFileDrop={mockOnFileDrop} disabled />);
    
    const dropzone = screen.getByTestId('upload-dropzone');
    expect(dropzone).toHaveClass('opacity-50', 'cursor-not-allowed');
    
    const file = new File(['audio content'], 'test-audio.mp3', { type: 'audio/mpeg' });
    
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });
    expect(mockOnFileDrop).not.toHaveBeenCalled();
  });

  test('edge case - uploading state shows progress indicator', () => {
    render(<UploadDropzone onFileDrop={mockOnFileDrop} isUploading />);
    
    expect(screen.getByText(/uploading.../i)).toBeInTheDocument();
    expect(screen.getByTestId('upload-spinner')).toBeInTheDocument();
    
    const dropzone = screen.getByTestId('upload-dropzone');
    expect(dropzone).toHaveClass('opacity-50');
  });

  test('failure case - rejects invalid file types', () => {
    const mockRejectedFiles = vi.fn();
    render(
      <UploadDropzone 
        onFileDrop={mockOnFileDrop} 
        onRejectedFiles={mockRejectedFiles}
      />
    );
    
    const dropzone = screen.getByTestId('upload-dropzone');
    const invalidFile = new File(['text content'], 'document.txt', { type: 'text/plain' });
    
    fireEvent.drop(dropzone, { dataTransfer: { files: [invalidFile] } });
    
    expect(mockOnFileDrop).not.toHaveBeenCalled();
    expect(mockRejectedFiles).toHaveBeenCalledWith([
      expect.objectContaining({
        file: invalidFile,
        errors: expect.arrayContaining([
          expect.objectContaining({ code: 'file-invalid-type' })
        ])
      })
    ]);
  });

  test('failure case - rejects oversized files', () => {
    const mockRejectedFiles = vi.fn();
    render(
      <UploadDropzone 
        onFileDrop={mockOnFileDrop} 
        onRejectedFiles={mockRejectedFiles}
        maxSize={25 * 1024 * 1024} // 25MB
      />
    );
    
    const dropzone = screen.getByTestId('upload-dropzone');
    // Create a file that would be too large (mock 30MB)
    const largeFile = new File(['x'.repeat(30 * 1024 * 1024)], 'large-audio.mp3', { 
      type: 'audio/mpeg' 
    });
    Object.defineProperty(largeFile, 'size', { value: 30 * 1024 * 1024 });
    
    fireEvent.drop(dropzone, { dataTransfer: { files: [largeFile] } });
    
    expect(mockOnFileDrop).not.toHaveBeenCalled();
    expect(mockRejectedFiles).toHaveBeenCalledWith([
      expect.objectContaining({
        file: largeFile,
        errors: expect.arrayContaining([
          expect.objectContaining({ code: 'file-too-large' })
        ])
      })
    ]);
  });

  test('failure case - handles multiple files when only single allowed', () => {
    const mockRejectedFiles = vi.fn();
    render(
      <UploadDropzone 
        onFileDrop={mockOnFileDrop} 
        onRejectedFiles={mockRejectedFiles}
        multiple={false}
      />
    );
    
    const dropzone = screen.getByTestId('upload-dropzone');
    const files = [
      new File(['audio1'], 'audio1.mp3', { type: 'audio/mpeg' }),
      new File(['audio2'], 'audio2.mp3', { type: 'audio/mpeg' })
    ];
    
    fireEvent.drop(dropzone, { dataTransfer: { files } });
    
    // Should accept first file and reject the rest
    expect(mockOnFileDrop).toHaveBeenCalledWith([files[0]]);
    expect(mockRejectedFiles).toHaveBeenCalledWith([
      expect.objectContaining({
        file: files[1],
        errors: expect.arrayContaining([
          expect.objectContaining({ code: 'too-many-files' })
        ])
      })
    ]);
  });

  test('edge case - supports multiple file selection when enabled', () => {
    render(<UploadDropzone onFileDrop={mockOnFileDrop} multiple />);
    
    const dropzone = screen.getByTestId('upload-dropzone');
    const files = [
      new File(['audio1'], 'audio1.mp3', { type: 'audio/mpeg' }),
      new File(['audio2'], 'audio2.wav', { type: 'audio/wav' })
    ];
    
    fireEvent.drop(dropzone, { dataTransfer: { files } });
    
    expect(mockOnFileDrop).toHaveBeenCalledWith(files);
  });

  test('edge case - shows file format help text', () => {
    render(<UploadDropzone onFileDrop={mockOnFileDrop} />);
    
    expect(screen.getByText(/supports mp3, wav, m4a, flac/i)).toBeInTheDocument();
  });

  test('failure case - prevents default drag behaviors', () => {
    render(<UploadDropzone onFileDrop={mockOnFileDrop} />);
    
    const dropzone = screen.getByTestId('upload-dropzone');
    
    const dragOverEvent = new Event('dragover', { bubbles: true });
    const preventDefaultSpy = vi.spyOn(dragOverEvent, 'preventDefault');
    
    fireEvent(dropzone, dragOverEvent);
    
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  test('edge case - keyboard accessibility for file input', () => {
    render(<UploadDropzone onFileDrop={mockOnFileDrop} />);
    
    const fileInput = screen.getByTestId('file-input');
    
    fireEvent.keyDown(fileInput, { key: 'Enter' });
    fireEvent.keyDown(fileInput, { key: ' ' });
    
    // Should be focusable and accessible
    expect(fileInput).toHaveAttribute('tabIndex', '0');
  });
});