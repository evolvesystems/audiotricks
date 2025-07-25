/**
 * Lazy Loading Wrapper Component
 * Provides loading states and error handling for lazy-loaded components
 */

import React, { Suspense, ComponentType, ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { logger } from '../utils/logger';

interface LazyWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error) => void;
}

/**
 * Default loading component
 */
const DefaultLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-gray-600">Loading...</span>
  </div>
);

/**
 * Default error fallback component
 */
const DefaultErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-red-50 rounded-lg border border-red-200">
    <div className="flex items-center mb-4">
      <svg className="h-6 w-6 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <h3 className="text-lg font-medium text-red-800">Failed to load component</h3>
    </div>
    
    <p className="text-sm text-red-600 mb-4 text-center max-w-md">
      {error.message || 'An error occurred while loading this component.'}
    </p>
    
    <button
      onClick={retry}
      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
    >
      Try Again
    </button>
  </div>
);

/**
 * Lazy wrapper component that provides consistent loading and error states
 */
export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback = <DefaultLoadingFallback />,
  errorFallback = DefaultErrorFallback,
  onError
}) => {
  const handleError = (error: Error, errorInfo: { componentStack: string }) => {
    logger.error('Lazy component loading error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
    
    if (onError) {
      onError(error);
    }
  };

  return (
    <ErrorBoundary
      FallbackComponent={errorFallback}
      onError={handleError}
      onReset={() => window.location.reload()}
    >
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * Higher-order component for wrapping lazy-loaded components
 */
export function withLazyWrapper<P extends object>(
  Component: ComponentType<P>,
  options?: {
    fallback?: ReactNode;
    errorFallback?: ComponentType<{ error: Error; retry: () => void }>;
    onError?: (error: Error) => void;
  }
) {
  return function WrappedComponent(props: P) {
    return (
      <LazyWrapper
        fallback={options?.fallback}
        errorFallback={options?.errorFallback}
        onError={options?.onError}
      >
        <Component {...props} />
      </LazyWrapper>
    );
  };
}

/**
 * Utility function to create lazy components with built-in loading states
 */
export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    fallback?: ReactNode;
    errorFallback?: ComponentType<{ error: Error; retry: () => void }>;
    onError?: (error: Error) => void;
    preload?: boolean;
  }
) {
  const LazyComponent = React.lazy(importFn);

  // Preload the component if requested
  if (options?.preload) {
    importFn().catch((error) => {
      logger.warn('Failed to preload component:', error);
    });
  }

  return function LazyComponentWrapper(props: P) {
    return (
      <LazyWrapper
        fallback={options?.fallback}
        errorFallback={options?.errorFallback}
        onError={options?.onError}
      >
        <LazyComponent {...props} />
      </LazyWrapper>
    );
  };
}

/**
 * Component for handling route-level code splitting
 */
interface LazyRouteProps {
  component: ComponentType<any>;
  fallback?: ReactNode;
  errorFallback?: ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error) => void;
  [key: string]: any;
}

export const LazyRoute: React.FC<LazyRouteProps> = ({
  component: Component,
  fallback,
  errorFallback,
  onError,
  ...props
}) => {
  return (
    <LazyWrapper
      fallback={fallback}
      errorFallback={errorFallback}
      onError={onError}
    >
      <Component {...props} />
    </LazyWrapper>
  );
};

/**
 * Hook for preloading components
 */
export function usePreloadComponent(
  importFn: () => Promise<{ default: ComponentType<any> }>,
  condition: boolean = true
) {
  React.useEffect(() => {
    if (condition) {
      const timer = setTimeout(() => {
        importFn().catch((error) => {
          logger.warn('Failed to preload component:', error);
        });
      }, 100); // Small delay to avoid blocking initial render

      return () => clearTimeout(timer);
    }
  }, [importFn, condition]);
}

/**
 * Component for lazy loading based on intersection (viewport visibility)
 */
interface LazyOnIntersectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  className?: string;
}

export const LazyOnIntersection: React.FC<LazyOnIntersectionProps> = ({
  children,
  fallback = <div className="h-32" />, // Placeholder height
  rootMargin = '50px',
  threshold = 0.1,
  className
}) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoaded) {
          setIsIntersecting(true);
          setIsLoaded(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [rootMargin, threshold, isLoaded]);

  return (
    <div ref={ref} className={className}>
      {isIntersecting ? (
        <Suspense fallback={fallback}>
          {children}
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  );
};