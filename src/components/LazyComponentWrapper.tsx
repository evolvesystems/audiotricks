// Wrapper for lazy-loaded components with loading and error states
import React, { Suspense, ComponentType } from 'react';
import LoadingSpinner from './LoadingSpinner';
import ErrorBoundary from './ErrorBoundary';

interface LazyComponentWrapperProps {
  component: ComponentType<any>;
  componentProps?: any;
  loadingMessage?: string;
}

export default function LazyComponentWrapper({ 
  component: Component, 
  componentProps = {},
  loadingMessage = 'Loading...'
}: LazyComponentWrapperProps) {
  return (
    <ErrorBoundary>
      <Suspense 
        fallback={
          <div className="flex items-center justify-center p-8">
            <LoadingSpinner message={loadingMessage} />
          </div>
        }
      >
        <Component {...componentProps} />
      </Suspense>
    </ErrorBoundary>
  );
}