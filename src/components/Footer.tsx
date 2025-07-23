import React from 'react';
import buildInfo from '../buildInfo.json';

export default function Footer() {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>© 2025 AudioTricks</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">
              Version {buildInfo.version}
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="flex items-center gap-1">
              <span className="font-medium">Build:</span>
              <code className="bg-gray-200 px-1 py-0.5 rounded text-xs">
                {buildInfo.git.commitHash}
              </code>
              {buildInfo.git.branch !== 'main' && (
                <span className="text-amber-600">
                  ({buildInfo.git.branch})
                </span>
              )}
            </span>
            
            <span className="hidden sm:inline">•</span>
            
            <span className="flex items-center gap-1">
              <span className="font-medium">Deployed:</span>
              <time dateTime={buildInfo.buildDate}>
                {formatDate(buildInfo.buildDate)}
              </time>
            </span>
            
            {buildInfo.buildNumber !== 'local' && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">Build #:</span>
                  {buildInfo.buildNumber}
                </span>
              </>
            )}
          </div>
        </div>
        
        {/* Development mode indicator */}
        {buildInfo.environment === 'development' && (
          <div className="mt-2 text-xs text-amber-600">
            Development Mode
          </div>
        )}
      </div>
    </footer>
  );
}