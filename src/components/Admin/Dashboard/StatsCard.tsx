/**
 * Modern Stats Card Component
 * Reusable card for displaying key metrics with gradients and animations
 */

import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  subtitle?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  gradient,
  subtitle 
}: StatsCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-900/5 transition-all duration-300 hover:shadow-xl hover:scale-105">
      <div className={`absolute inset-0 opacity-5 ${gradient}`} />
      
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="mt-2 flex items-baseline">
              <p className="text-3xl font-bold tracking-tight text-gray-900">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              {change && (
                <span className={`ml-2 flex items-baseline text-sm font-semibold ${
                  change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {change.type === 'increase' ? '↗' : '↘'} {Math.abs(change.value)}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
          
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${gradient} shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}