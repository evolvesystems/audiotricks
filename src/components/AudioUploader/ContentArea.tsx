import React from 'react'
import ProcessingProgressEnhanced from '../ProcessingProgressEnhanced'
import FileUploadArea from './FileUploadArea'
import UrlUploadArea from './UrlUploadArea'

interface ContentAreaProps {
  inputMode: 'upload' | 'url'
  isProcessing: boolean
  uploadedFile: File | null
  isDragActive: boolean
  hasApiKey: boolean
  processingStage: 'uploading' | 'transcribing' | 'summarizing' | 'complete'
  audioUrl: string
  currentFileSize?: number
  chunkProgress?: { current: number; total: number }
  onStartProcessing: () => void
  onUrlChange: (url: string) => void
  onUrlSubmit: () => void
  onCancel: () => void
  onClearError: () => void
  getRootProps: () => any
  getInputProps: () => any
}

const ContentArea: React.FC<ContentAreaProps> = ({
  inputMode,
  isProcessing,
  uploadedFile,
  isDragActive,
  hasApiKey,
  processingStage,
  audioUrl,
  currentFileSize,
  chunkProgress,
  onStartProcessing,
  onUrlChange,
  onUrlSubmit,
  onCancel,
  onClearError,
  getRootProps,
  getInputProps
}) => {
  return (
    <>
      {inputMode === 'upload' ? (
        isProcessing ? (
          <ProcessingProgressEnhanced 
            stage={processingStage}
            fileName={uploadedFile?.name}
            fileSize={uploadedFile?.size}
            chunkProgress={chunkProgress}
            onCancel={onCancel}
          />
        ) : (
          <FileUploadArea
            uploadedFile={uploadedFile}
            isDragActive={isDragActive}
            isProcessing={isProcessing}
            hasApiKey={hasApiKey}
            onStartProcessing={onStartProcessing}
            getRootProps={getRootProps}
            getInputProps={getInputProps}
          />
        )
      ) : (
        isProcessing ? (
          <ProcessingProgressEnhanced 
            stage={processingStage}
            fileName={audioUrl.split('/').pop()}
            fileSize={currentFileSize}
            chunkProgress={chunkProgress}
            onCancel={onCancel}
            audioUrl={audioUrl}
          />
        ) : (
          <UrlUploadArea
            audioUrl={audioUrl}
            onUrlChange={(url) => {
              onUrlChange(url)
              onClearError()
            }}
            onSubmit={onUrlSubmit}
            isProcessing={isProcessing}
            hasApiKey={hasApiKey}
          />
        )
      )}
    </>
  )
}

export default ContentArea