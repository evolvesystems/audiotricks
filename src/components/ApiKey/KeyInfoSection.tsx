import React from 'react';
import { ApiKeyInfo } from '../../services/api';

interface KeyInfoSectionProps {
  info: ApiKeyInfo;
}

export default function KeyInfoSection({ info }: KeyInfoSectionProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Key Prefix:</span>
          <span className="ml-2 font-mono">{info.keyPrefix}</span>
        </div>
        <div>
          <span className="text-gray-500">Added:</span>
          <span className="ml-2">
            {info.createdAt && new Date(info.createdAt).toLocaleDateString()}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Last Used:</span>
          <span className="ml-2">
            {info.lastUsedAt 
              ? new Date(info.lastUsedAt).toLocaleDateString()
              : 'Never'
            }
          </span>
        </div>
        <div>
          <span className="text-gray-500">Usage Count:</span>
          <span className="ml-2">{info.usageCount || 0}</span>
        </div>
      </div>
    </div>
  );
}