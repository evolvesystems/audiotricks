// Dynamic imports for code splitting and performance
import { lazy } from 'react';

// Lazy load heavy components
export const LazyPDFExport = () => import('../utils/pdfExport');
export const LazyDOCXExport = () => import('../utils/docxExport');
export const LazyAudioSplitter = () => import('../utils/audioSplitter');
export const LazyHistoryDiagnostic = () => import('../utils/historyDiagnostic');

// Lazy load feature components
export const LazyAudioEditor = lazy(() => import('../components/AudioEditor'));
export const LazyResultsDisplay = lazy(() => import('../components/ResultsDisplay2'));
export const LazyHistoryPanel = lazy(() => import('../components/HistoryPanel'));

// Lazy load admin components (already done in Admin/index.tsx)
export { 
  AdminDashboard,
  UserDashboard,
  WorkspaceDashboard,
  UserModal,
  WorkspaceModal,
  WorkspaceUsersModal
} from '../components/Admin';

// Helper function to preload components
export function preloadComponent(componentLoader: () => Promise<any>) {
  componentLoader();
}

// Preload critical components after initial render
export function preloadCriticalComponents() {
  // These components are likely to be used soon
  setTimeout(() => {
    preloadComponent(() => import('../components/ResultsDisplay2'));
    preloadComponent(() => import('../components/HistoryPanel'));
  }, 2000);
}